package com.verry.finanzasapp.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.verry.finanzasapp.network.NetworkModule
import com.verry.finanzasapp.network.ServerConfig
import com.verry.finanzasapp.network.SettingRequest
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    // Estado de Red local
    var serverUrlInput by remember { mutableStateOf(ServerConfig.getServerUrl(context)) }
    var networkStatus by remember { mutableStateOf("") }

    // Estado de Ajustes del Backend
    var dolarSource by remember { mutableStateOf("oficial") }
    var btcSource by remember { mutableStateOf("binance") }
    var uvaSource by remember { mutableStateOf("bcra") }
    var backendStatus by remember { mutableStateOf("") }
    var isLoadingBackendSettings by remember { mutableStateOf(true) }

    // Cargar ajustes desde el backend al iniciar
    LaunchedEffect(Unit) {
        isLoadingBackendSettings = true
        try {
            val apiService = NetworkModule.provideApiService(context)
            val settings = apiService.getSettings()
            settings["dolar_source"]?.let { dolarSource = it }
            settings["btc_source"]?.let { btcSource = it }
            settings["uva_source"]?.let { uvaSource = it }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            isLoadingBackendSettings = false
        }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF090D16))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "⚙️ Ajustes del Sistema y Red",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Administrá la conectividad local de la app y las fuentes de cotización globales.",
                fontSize = 12.sp,
                color = Color(0xFF94A3B8)
            )
        }

        // --- TARJETA 1: CONEXIÓN DE RED (LOCAL ANDROID) ---
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "📡 Conectividad Red Local (IP Notebook)",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF3B82F6)
                    )
                    Text(
                        text = "Dirección IP del servidor Node.js (ej: http://192.168.1.12:3000).",
                        fontSize = 11.sp,
                        color = Color(0xFF94A3B8)
                    )

                    OutlinedTextField(
                        value = serverUrlInput,
                        onValueChange = { serverUrlInput = it },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Color(0xFF3B82F6),
                            unfocusedBorderColor = Color(0xFF232F48)
                        )
                    )

                    Button(
                        onClick = {
                            ServerConfig.setServerUrl(context, serverUrlInput)
                            networkStatus = "¡URL de red guardada con éxito!"
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(text = "Guardar Red Local", color = Color.White)
                    }

                    if (networkStatus.isNotBlank()) {
                        Text(text = networkStatus, fontSize = 12.sp, color = Color(0xFF10B981))
                    }
                }
            }
        }

        // --- TARJETA 2: PREFERENCIAS Y COTIZACIONES (BACKEND) ---
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "💱 Fuentes de Cotizaciones (Sincronizado con Web)",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF3B82F6)
                    )

                    if (isLoadingBackendSettings) {
                        Box(modifier = Modifier.fillMaxWidth().padding(20.dp), contentAlignment = androidx.compose.ui.Alignment.Center) {
                            CircularProgressIndicator(color = Color(0xFF3B82F6), modifier = Modifier.size(24.dp))
                        }
                    } else {
                        // Selección Dólar
                        Text(text = "Cotización Dólar", fontSize = 12.sp, color = Color(0xFFF1F5F9), fontWeight = FontWeight.Bold)
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            listOf("oficial" to "Oficial", "blue" to "Blue", "mep" to "MEP").forEach { (valKey, label) ->
                                Button(
                                    onClick = { dolarSource = valKey },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (dolarSource == valKey) Color(0xFF3B82F6) else Color(0xFF1E293B)
                                    ),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text(label, fontSize = 11.sp, color = Color.White)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        // Selección Bitcoin
                        Text(text = "Cotización Bitcoin", fontSize = 12.sp, color = Color(0xFFF1F5F9), fontWeight = FontWeight.Bold)
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            listOf("binance" to "Binance", "coingecko" to "CoinGecko").forEach { (valKey, label) ->
                                Button(
                                    onClick = { btcSource = valKey },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (btcSource == valKey) Color(0xFF3B82F6) else Color(0xFF1E293B)
                                    ),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text(label, fontSize = 11.sp, color = Color.White)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        // Selección UVA
                        Text(text = "Índice UVA (Créditos Hipotecarios)", fontSize = 12.sp, color = Color(0xFFF1F5F9), fontWeight = FontWeight.Bold)
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            listOf("bcra" to "BCRA Oficial", "manual" to "Manual").forEach { (valKey, label) ->
                                Button(
                                    onClick = { uvaSource = valKey },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (uvaSource == valKey) Color(0xFF3B82F6) else Color(0xFF1E293B)
                                    ),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text(label, fontSize = 11.sp, color = Color.White)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Button(
                            onClick = {
                                scope.launch {
                                    backendStatus = "Guardando en servidor..."
                                    try {
                                        val apiService = NetworkModule.provideApiService(context)
                                        apiService.updateSetting(SettingRequest("dolar_source", dolarSource))
                                        apiService.updateSetting(SettingRequest("btc_source", btcSource))
                                        apiService.updateSetting(SettingRequest("uva_source", uvaSource))
                                        backendStatus = "¡Configuración guardada en PC con éxito!"
                                    } catch (e: Exception) {
                                        backendStatus = "Error al guardar: ${e.message}"
                                    }
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(text = "Guardar Preferencias en Backend", color = Color.White)
                        }

                        if (backendStatus.isNotBlank()) {
                            Text(text = backendStatus, fontSize = 12.sp, color = Color(0xFFF59E0B))
                        }
                    }
                }
            }
        }
    }
}

