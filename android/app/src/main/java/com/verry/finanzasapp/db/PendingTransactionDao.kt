package com.verry.finanzasapp.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query

@Dao
interface PendingTransactionDao {
    @Insert
    suspend fun insertTransaction(tx: PendingTransactionEntity)

    @Query("SELECT * FROM pending_transactions ORDER BY createdAt ASC")
    suspend fun getAllPendingTransactions(): List<PendingTransactionEntity>

    @Query("DELETE FROM pending_transactions WHERE id = :id")
    suspend fun deleteTransaction(id: Long)

    @Query("SELECT COUNT(*) FROM pending_transactions")
    suspend fun getPendingCount(): Int
}