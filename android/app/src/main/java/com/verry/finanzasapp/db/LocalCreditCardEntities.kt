package com.verry.finanzasapp.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "local_card_projections")
data class LocalCreditCardProjectionEntity(
    @PrimaryKey val id: String, // Combinación de cardUid + month para unicidad
    val cardUid: String?,
    val cardTitle: String?,
    val month: String?,
    val totalExpense: Double?,
    val totalIncome: Double?,
    val netTotal: Double?
)

@Entity(tableName = "local_card_details")
data class LocalCreditCardDetailEntity(
    @PrimaryKey val id: String,
    val cardUid: String, // Para saber a qué tarjeta pertenece
    val month: String,   // Para saber de qué período es
    val installmentNumber: Int,
    val totalInstallments: Int,
    val amount: Double,
    val dueDate: String,
    val status: String,
    val purchaseDate: String?,
    val description: String?,
    val tagTitle: String?,
    val subcategoryTitle: String?,
    val parentCategoryTitle: String?,
    val itemType: String?
)
