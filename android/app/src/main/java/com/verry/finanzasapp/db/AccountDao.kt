package com.verry.finanzasapp.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface AccountDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveAccounts(accounts: List<AccountEntity>)

    @Query("SELECT * FROM local_accounts")
    suspend fun getLocalAccounts(): List<AccountEntity>
}

