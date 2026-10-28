package com.verry.finanzasapp.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        PendingTransactionEntity::class,
        AccountEntity::class,
        CategoryEntity::class
    ],
    version = 6,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun categoryDao(): CategoryDao
    abstract fun accountDao(): AccountDao
    abstract fun pendingTransactionDao(): PendingTransactionDao // <-- ¡Esta es la línea que faltaba declarar!

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "finanzas_database"
                )
                    .fallbackToDestructiveMigration() // Permite recrear la BD si cambia el esquema en desarrollo
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}