package com.verry.finanzasapp.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface CategoryDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveCategories(categories: List<CategoryEntity>)

    @Query("SELECT * FROM local_categories ORDER BY title ASC")
    suspend fun getLocalCategories(): List<CategoryEntity>

    // NUEVO: Limpiar la tabla local antes de reinsertar las frescas de la PC
    @Query("DELETE FROM local_categories")
    suspend fun clearCategories()
}