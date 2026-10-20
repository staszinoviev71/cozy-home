package com.cozyhome.companion

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import org.eclipse.paho.client.mqttv3.*
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence
import org.json.JSONObject

class CozySyncService : Service() {

    private var mqttClient: MqttAsyncClient? = null
    @Volatile
    private var isRunning = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createServiceNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createForegroundNotification()
        startForeground(999, notification)

        if (!isRunning) {
            isRunning = true
            connectMqtt()
        }

        return START_STICKY
    }

    private fun createServiceNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                MainActivity.SERVICE_CHANNEL_ID,
                "Фоновая связь для двоих",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Поддерживает мгновенную доставку уведомлений и синхронизацию виджета"
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun createForegroundNotification() =
        NotificationCompat.Builder(this, MainActivity.SERVICE_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification_home)
            .setContentTitle("Уютный Дом")
            .setContentText("Связь с партнером активна")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setContentIntent(
                PendingIntent.getActivity(
                    this,
                    0,
                    Intent(this, MainActivity::class.java),
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
            )
            .build()

    @Synchronized
    private fun connectMqtt() {
        try {
            val prefs = getSharedPreferences("cozy_widget_prefs", Context.MODE_PRIVATE)
            val pairCode = prefs.getString("pair_code", "777888") ?: "777888"
            val myDeviceId = prefs.getString("my_device_id", "") ?: ""

            val clientId = "cozy_bg_" + (if (myDeviceId.isNotBlank()) myDeviceId else "dev_" + System.currentTimeMillis())
            val brokerUrl = "ssl://broker.emqx.io:8883"

            mqttClient?.let {
                try {
                    if (it.isConnected) it.disconnect()
                } catch (e: Exception) {}
            }

            val client = MqttAsyncClient(brokerUrl, clientId, MemoryPersistence())
            mqttClient = client

            val options = MqttConnectOptions().apply {
                isAutomaticReconnect = true
                isCleanSession = true
                connectionTimeout = 10
                keepAliveInterval = 30
            }

            client.setCallback(object : MqttCallbackExtended {
                override fun connectComplete(reconnect: Boolean, serverURI: String?) {
                    val topic = "cozyhome/v2/room_$pairCode"
                    try {
                        client.subscribe(topic, 1)
                    } catch (e: Exception) {}
                }

                override fun connectionLost(cause: Throwable?) {}

                override fun messageArrived(topic: String?, message: MqttMessage?) {
                    if (message != null) {
                        val payload = String(message.payload)
                        handleIncomingPayload(payload, myDeviceId)
                    }
                }

                override fun deliveryComplete(token: IMqttDeliveryToken?) {}
            })

            client.connect(options, null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    val topic = "cozyhome/v2/room_$pairCode"
                    try {
                        client.subscribe(topic, 1)
                    } catch (e: Exception) {}
                }

                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {}
            })
        } catch (e: Exception) {}
    }

    private fun handleIncomingPayload(rawMessage: String, myDeviceId: String) {
        try {
            val msg = JSONObject(rawMessage)
            val senderDeviceId = msg.optString("senderDeviceId")
            if (myDeviceId.isNotBlank() && senderDeviceId == myDeviceId) {
                return
            }

            val type = msg.optString("type")
            val data = msg.optJSONObject("data") ?: return

            when (type) {
                "SOS_PUSH" -> {
                    val sender = data.optString("sender", "Партнер")
                    val text = data.optString("text", "")
                    val title = data.optString("title", "$sender: Срочно нужно!")
                    val icon = data.optString("icon", "🚨")
                    MainActivity.showSystemNotification(this, title, text, icon)
                }

                "MOOD_UPDATE" -> {
                    val moodObj = data.optJSONObject("mood")
                    val role = data.optString("role", "wife")
                    val moodId = moodObj?.optString("id", "happy") ?: "happy"
                    val moodTitle = moodObj?.optString("title", "На волне радости!") ?: "На волне радости!"
                    val moodEmoji = moodObj?.optString("emoji", "✨") ?: "✨"
                    val moodColor = moodObj?.optString("color", "#FF8A65") ?: "#FF8A65"
                    val partnerLabel = if (role.lowercase() == "husband") "НАСТРОЕНИЕ: МУЖ" else "НАСТРОЕНИЕ: ЛЮБИМАЯ"

                    val prefs = getSharedPreferences("cozy_widget_prefs", Context.MODE_PRIVATE)
                    val unbought = prefs.getInt("unbought_count", 0)

                    PartnerMoodWidgetProvider.saveWidgetData(
                        context = this,
                        partnerLabel = partnerLabel,
                        moodTitle = moodTitle,
                        moodEmoji = moodEmoji,
                        statusTime = "только что • связь отличная",
                        moodId = moodId,
                        partnerRole = role,
                        avatarType = "pixar",
                        moodColor = moodColor,
                        unboughtCount = unbought
                    )
                }

                "SHOPPING_UPDATE" -> {
                    val itemsArr = data.optJSONArray("items")
                    var unbought = 0
                    if (itemsArr != null) {
                        for (i in 0 until itemsArr.length()) {
                            val it = itemsArr.optJSONObject(i)
                            if (it != null && !it.optBoolean("checked", false)) {
                                unbought++
                            }
                        }
                    }

                    val prefs = getSharedPreferences("cozy_widget_prefs", Context.MODE_PRIVATE)
                    val partnerLabel = prefs.getString("partner_label", "НАСТРОЕНИЕ: ЛЮБИМАЯ") ?: "НАСТРОЕНИЕ: ЛЮБИМАЯ"
                    val moodTitle = prefs.getString("mood_title", "На волне радости!") ?: "На волне радости!"
                    val moodEmoji = prefs.getString("mood_emoji", "✨") ?: "✨"
                    val moodId = prefs.getString("mood_id", "happy")
                    val partnerRole = prefs.getString("partner_role", "wife")
                    val moodColor = prefs.getString("mood_color", "#FF8A65")

                    PartnerMoodWidgetProvider.saveWidgetData(
                        context = this,
                        partnerLabel = partnerLabel,
                        moodTitle = moodTitle,
                        moodEmoji = moodEmoji,
                        statusTime = "только что • связь отличная",
                        moodId = moodId,
                        partnerRole = partnerRole,
                        avatarType = "pixar",
                        moodColor = moodColor,
                        unboughtCount = unbought
                    )
                }
            }
        } catch (e: Exception) {}
    }

    override fun onDestroy() {
        isRunning = false
        try {
            mqttClient?.disconnect()
        } catch (e: Exception) {}
        mqttClient = null
        super.onDestroy()
    }

    companion object {
        fun start(context: Context) {
            val intent = Intent(context, CozySyncService::class.java)
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {}
        }
    }
}
