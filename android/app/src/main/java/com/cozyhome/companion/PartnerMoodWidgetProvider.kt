package com.cozyhome.companion

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.*
import android.view.View
import android.widget.RemoteViews

class PartnerMoodWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        private const val PREFS_NAME = "cozy_widget_prefs"

        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val partnerLabel = prefs.getString("partner_label", "НАСТРОЕНИЕ: ЛЮБИМАЯ") ?: "НАСТРОЕНИЕ: ЛЮБИМАЯ"
            val moodTitle = prefs.getString("mood_title", "На волне радости!") ?: "На волне радости!"
            val moodEmoji = prefs.getString("mood_emoji", "✨") ?: "✨"
            val statusTime = prefs.getString("status_time", "только что • связь отличная") ?: "только что • связь отличная"
            val moodId = prefs.getString("mood_id", "happy") ?: "happy"
            val partnerRole = prefs.getString("partner_role", "wife") ?: "wife"
            val moodColorHex = prefs.getString("mood_color", "#FF8A65") ?: "#FF8A65"
            val unboughtCount = prefs.getInt("unbought_count", 0)

            val views = RemoteViews(context.packageName, R.layout.widget_partner_mood)
            views.setTextViewText(R.id.widget_partner_label, partnerLabel)
            views.setTextViewText(R.id.widget_mood_title, moodTitle)
            views.setTextViewText(R.id.widget_status_time, statusTime)
            views.setTextViewText(R.id.btn_widget_shopping, "🛒 $unboughtCount в списке")

            // Цвет надписи статуса партнера
            try {
                val colorInt = Color.parseColor(moodColorHex)
                views.setTextColor(R.id.widget_partner_label, colorInt)
            } catch (e: Exception) {}

            // Рендеринг 3D Pixar аватара с неоновым свечением ауры
            val avatarBitmap = loadAvatarBitmap(context, partnerRole, moodId, moodColorHex)
            if (avatarBitmap != null) {
                views.setViewVisibility(R.id.widget_avatar_image, View.VISIBLE)
                views.setViewVisibility(R.id.widget_avatar_emoji, View.GONE)
                views.setImageViewBitmap(R.id.widget_avatar_image, avatarBitmap)
            } else {
                views.setViewVisibility(R.id.widget_avatar_image, View.GONE)
                views.setViewVisibility(R.id.widget_avatar_emoji, View.VISIBLE)
                views.setTextViewText(R.id.widget_avatar_emoji, moodEmoji)
            }

            // Открытие приложения при клике на виджет или его кнопки
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
            views.setOnClickPendingIntent(R.id.btn_widget_hug, pendingIntent)
            views.setOnClickPendingIntent(R.id.btn_widget_on_way, pendingIntent)
            views.setOnClickPendingIntent(R.id.btn_widget_shopping, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun loadAvatarBitmap(context: Context, partnerRole: String, moodId: String, moodColorHex: String): Bitmap? {
            val prefix = if (partnerRole.lowercase() == "husband") "guy" else "girl"
            val assetPath = "assets/avatars/${prefix}_${moodId.lowercase()}.png"
            return try {
                val original = context.assets.open(assetPath).use { stream ->
                    BitmapFactory.decodeStream(stream)
                } ?: return null

                val size = 180
                val output = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
                val canvas = Canvas(output)

                val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    isDither = true
                    isFilterBitmap = true
                }

                val colorInt = try {
                    Color.parseColor(moodColorHex)
                } catch (e: Exception) {
                    Color.parseColor("#FF8A65")
                }

                // 1. Мягкая внешняя аура неонового свечения
                paint.color = Color.argb(40, Color.red(colorInt), Color.green(colorInt), Color.blue(colorInt))
                canvas.drawCircle(size / 2f, size / 2f, (size / 2f), paint)

                paint.color = Color.argb(90, Color.red(colorInt), Color.green(colorInt), Color.blue(colorInt))
                canvas.drawCircle(size / 2f, size / 2f, (size / 2f) - 3f, paint)

                // 2. Круговая маска
                val path = Path().apply {
                    addCircle(size / 2f, size / 2f, (size / 2f) - 8f, Path.Direction.CCW)
                }
                canvas.save()
                canvas.clipPath(path)

                // 3. Рисуем 3D Pixar аватар
                val destRect = Rect(8, 8, size - 8, size - 8)
                paint.color = Color.WHITE
                canvas.drawBitmap(original, null, destRect, paint)
                canvas.restore()

                // 4. Тонкая светлая стеклянная Liquid Glass кайка
                val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    style = Paint.Style.STROKE
                    strokeWidth = 3f
                    color = Color.argb(200, 255, 255, 255)
                }
                canvas.drawCircle(size / 2f, size / 2f, (size / 2f) - 8f, strokePaint)

                // 5. Парящие мерцающие микро-искры (Floating Sparks)
                val sparkPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = Color.WHITE
                }
                canvas.drawCircle(22f, 26f, 3.5f, sparkPaint)
                canvas.drawCircle(size - 22f, 30f, 4f, sparkPaint)
                canvas.drawCircle(18f, size - 34f, 3f, sparkPaint)
                canvas.drawCircle(size - 26f, size - 26f, 3f, sparkPaint)

                output
            } catch (e: Exception) {
                null
            }
        }

        fun saveWidgetData(
            context: Context,
            partnerLabel: String,
            moodTitle: String,
            moodEmoji: String,
            statusTime: String,
            moodId: String? = null,
            partnerRole: String? = null,
            avatarType: String? = null,
            moodColor: String? = null,
            unboughtCount: Int = 0
        ) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val editor = prefs.edit()
                .putString("partner_label", partnerLabel)
                .putString("mood_title", moodTitle)
                .putString("mood_emoji", moodEmoji)
                .putString("status_time", statusTime)
                .putInt("unbought_count", unboughtCount)

            if (!moodId.isNullOrBlank()) editor.putString("mood_id", moodId)
            if (!partnerRole.isNullOrBlank()) editor.putString("partner_role", partnerRole)
            if (!avatarType.isNullOrBlank()) editor.putString("avatar_type", avatarType)
            if (!moodColor.isNullOrBlank()) editor.putString("mood_color", moodColor)

            editor.apply()
            updateAllWidgets(context)
        }

        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = ComponentName(context, PartnerMoodWidgetProvider::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
            for (appWidgetId in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId)
            }
        }
    }
}
