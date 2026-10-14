package com.verry.finanzasapp.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "local_categories")
data class CategoryEntity(
    @PrimaryKey val uid: String,
    val title: String,
    val parentUid: String?
)

