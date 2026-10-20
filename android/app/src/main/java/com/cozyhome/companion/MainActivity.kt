package com.cozyhome.companion

import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.View
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import org.json.JSONObject

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    companion object {
        const val CHANNEL_ID = "household_urgent"
        const val SERVICE_CHANNEL_ID = "cozy_service_channel"
        private var notificationIdCounter = 1001

        fun showSystemNotification(context: Context, title: String, message: String, emoji: String) {
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val displayTitle = if (emoji.isNotBlank()) "$emoji $title" else title

            val builder = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification_home)
                .setContentTitle(displayTitle)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.notify(notificationIdCounter++, builder.build())
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // AMOLED Dark UI: Полноэкранный режим без рамок и заголовков
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        )
        window.statusBarColor = Color.parseColor("#0B0E17")
        window.navigationBarColor = Color.parseColor("#0B0E17")

        createNotificationChannel()
        requestNotificationPermission()

        webView = WebView(this)
        setContentView(webView)

        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.allowFileAccessFromFileURLs = true
        settings.allowUniversalAccessFromFileURLs = true
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                return false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {}

        // Подключаем нативный Android-мост для системных пушей и виджета
        webView.addJavascriptInterface(AndroidBridge(), "AndroidBridge")

        // Загружаем локальную копию (работает офлайн без интернета)
        webView.loadUrl("file:///android_asset/index.html")

        // Запускаем фоновую службу синхронизации 24/7
        CozySyncService.start(this)
    }

    override fun onResume() {
        super.onResume()
        CozySyncService.start(this)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Срочные оповещения для двоих"
            val descriptionText = "Мгновенные SOS-пуши, списки покупок и реакции от партнера"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
                enableLights(true)
                lightColor = Color.parseColor("#FF6B6B")
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 200, 100, 200, 100, 300)
            }
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 101)
            }
        }
    }

    inner class AndroidBridge {

        @JavascriptInterface
        fun showNotification(title: String, message: String, emoji: String) {
            showSystemNotification(this@MainActivity, title, message, emoji)
        }

        @JavascriptInterface
        fun setServerUrl(url: String) {
            val prefs = getSharedPreferences("cozy_widget_prefs", Context.MODE_PRIVATE)
            prefs.edit().putString("custom_server_url", url).apply()
            CozySyncService.start(this@MainActivity)
        }

        @JavascriptInterface
        fun setSyncInfo(deviceId: String, pairCode: String, role: String) {
            val prefs = getSharedPreferences("cozy_widget_prefs", Context.MODE_PRIVATE)
            prefs.edit()
                .putString("my_device_id", deviceId)
                .putString("pair_code", pairCode)
                .putString("my_role", role)
                .apply()

            // Перезапускаем фоновую службу с актуальным кодом
            CozySyncService.start(this@MainActivity)
        }

        @JavascriptInterface
        fun getSavedPartnerData(): String {
            val prefs = getSharedPreferences("cozy_widget_prefs", Context.MODE_PRIVATE)
            val obj = JSONObject()
            obj.put("partner_label", prefs.getString("partner_label", ""))
            obj.put("mood_title", prefs.getString("mood_title", ""))
            obj.put("mood_emoji", prefs.getString("mood_emoji", ""))
            obj.put("mood_id", prefs.getString("mood_id", "happy"))
            obj.put("mood_color", prefs.getString("mood_color", "#FF8A65"))
            obj.put("partner_role", prefs.getString("partner_role", "wife"))
            obj.put("unbought_count", prefs.getInt("unbought_count", 0))
            return obj.toString()
        }

        @JavascriptInterface
        fun updateWidget(partnerLabel: String, moodTitle: String, moodEmoji: String, statusTime: String) {
            updateWidget(partnerLabel, moodTitle, moodEmoji, statusTime, null, null, null, null, 0)
        }

        @JavascriptInterface
        fun updateWidget(
            partnerLabel: String,
            moodTitle: String,
            moodEmoji: String,
            statusTime: String,
            moodId: String?,
            partnerRole: String?,
            avatarType: String?,
            moodColor: String?,
            unboughtCount: Int
        ) {
            runOnUiThread {
                PartnerMoodWidgetProvider.saveWidgetData(
                    this@MainActivity,
                    partnerLabel,
                    moodTitle,
                    moodEmoji,
                    statusTime,
                    moodId,
                    partnerRole,
                    avatarType,
                    moodColor,
                    unboughtCount
                )
            }
        }

        @JavascriptInterface
        fun updateWidget(
            partnerLabel: String,
            moodTitle: String,
            moodEmoji: String,
            statusTime: String,
            moodId: String?,
            partnerRole: String?,
            avatarType: String?,
            moodColor: String?,
            unboughtCount: Double
        ) {
            updateWidget(
                partnerLabel,
                moodTitle,
                moodEmoji,
                statusTime,
                moodId,
                partnerRole,
                avatarType,
                moodColor,
                unboughtCount.toInt()
            )
        }

        @JavascriptInterface
        fun vibrate(milliseconds: Long) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                    vibratorManager.defaultVibrator.vibrate(VibrationEffect.createOneShot(milliseconds, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vibrator.vibrate(VibrationEffect.createOneShot(milliseconds, VibrationEffect.DEFAULT_AMPLITUDE))
                    } else {
                        @Suppress("DEPRECATION")
                        vibrator.vibrate(milliseconds)
                    }
                }
            } catch (e: Exception) {}
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
