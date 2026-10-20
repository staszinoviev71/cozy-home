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
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class CozySyncService : Service() {

    private var workerThread: Thread? = null
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
            startLongPolling()
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

    private fun startLongPolling() {
        workerThread?.interrupt()
        workerThread = Thread {
            var lastSince = System.currentTimeMillis() - 10000

            while (isRunning) {
                try {
                    val prefs = getSharedPreferences("cozy_widget_prefs", Context.MODE_PRIVATE)
                    val rawServerUrl = prefs.getString("custom_server_url", "")?.trim() ?: ""
                    val serverUrl = if (rawServerUrl.isNotBlank()) rawServerUrl.removeSuffix("/") else ""
                    val pairCode = prefs.getString("pair_code", "777888") ?: "777888"
                    val myDeviceId = prefs.getString("my_device_id", "") ?: ""

                    if (serverUrl.isBlank()) {
                        Thread.sleep(4000)
                        continue
                    }

                    val pollUrl = "$serverUrl/api/poll/$pairCode?deviceId=$myDeviceId&since=$lastSince"
                    val conn = (URL(pollUrl).openConnection() as HttpURLConnection).apply {
                        requestMethod = "GET"
                        connectTimeout = 10000
                        readTimeout = 30000
                    }

                    val code = conn.responseCode
                    if (code == 200) {
                        val text = conn.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
                        val json = JSONObject(text)
                        val events = json.optJSONArray("events")
                        if (events != null) {
                            for (i in 0 until events.length()) {
                                val ev = events.getJSONObject(i)
                                val evTime = ev.optLong("time")
                                if (evTime > lastSince) {
                                    lastSince = evTime
                                }
                                val msg = ev.optJSONObject("msg")
                                if (msg != null) {
                                    handleIncomingMessage(msg, myDeviceId)
                                }
                            }
                        }
                    } else {
                        Thread.sleep(3000)
                    }
                } catch (e: Exception) {
                    try {
                        Thread.sleep(3000)
                    } catch (ie: InterruptedException) {
                        break
                    }
                }
            }
        }.apply {
            isDaemon = true
            name = "CozyPollWorker"
            start()
        }
    }

    private fun handleIncomingMessage(msg: JSONObject, myDeviceId: String) {
        try {
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
        workerThread?.interrupt()
        workerThread = null
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
