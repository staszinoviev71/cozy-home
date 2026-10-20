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

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val channelId = "household_urgent"
    private var notificationIdCounter = 1001

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
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Срочные оповещения для двоих"
            val descriptionText = "Мгновенные SOS-пуши, списки покупок и реакции от партнера"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(channelId, name, importance).apply {
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
            val intent = Intent(this@MainActivity, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                this@MainActivity,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val displayTitle = if (emoji.isNotBlank()) "$emoji $title" else title

            val builder = NotificationCompat.Builder(this@MainActivity, channelId)
                .setSmallIcon(R.drawable.ic_notification_home)
                .setContentTitle(displayTitle)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.notify(notificationIdCounter++, builder.build())
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
