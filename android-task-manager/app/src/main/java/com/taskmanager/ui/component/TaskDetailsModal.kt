package com.taskmanager.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.taskmanager.domain.model.Card
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskDetailsModal(
    card: Card,
    phaseColor: String,
    adaptedPhaseName: String,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uriHandler = LocalUriHandler.current
    val scrollState = rememberScrollState()
    
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            dismissOnBackPress = true,
            dismissOnClickOutside = true,
            usePlatformDefaultWidth = false
        )
    ) {
        Card(
            modifier = modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f)
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = Color.White
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                // Header do modal
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            color = parseColor(phaseColor),
                            shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)
                        )
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = card.placa.uppercase(),
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = adaptedPhaseName,
                                fontSize = 14.sp,
                                color = Color.White.copy(alpha = 0.9f)
                            )
                        }
                        
                        IconButton(
                            onClick = onDismiss
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Fechar",
                                tint = Color.White
                            )
                        }
                    }
                }
                
                // Conteúdo scrollável
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(scrollState)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Informações do veículo
                    DetailSection(
                        title = "Informações do Veículo",
                        icon = Icons.Default.DirectionsCar
                    ) {
                        DetailItem("Placa", card.placa.uppercase())
                        DetailItem("Modelo", card.modeloVeiculo ?: "Não informado")
                        DetailItem("Origem da Locação", card.origemLocacao ?: "Não informado")
                    }
                    
                    // Informações de pessoas
                    DetailSection(
                        title = "Responsáveis",
                        icon = Icons.Default.People
                    ) {
                        DetailItem("Driver", card.nomeDriver.ifBlank { "Não informado" })
                        DetailItem("Chofer de Recolha", card.chofer.ifBlank { "Não informado" })
                        if (!card.emailChofer.isNullOrBlank()) {
                            DetailItem("Email do Chofer", card.emailChofer, isEmail = true)
                        }
                        DetailItem("Empresa Responsável", card.empresaResponsavel?.uppercase() ?: "Não informado")
                    }
                    
                    // Informações de contato
                    if (!card.telefoneContato.isNullOrBlank() || !card.telefoneOpcional.isNullOrBlank() || !card.emailCliente.isNullOrBlank()) {
                        DetailSection(
                            title = "Contatos",
                            icon = Icons.Default.ContactPhone
                        ) {
                            if (!card.telefoneContato.isNullOrBlank()) {
                                DetailItem("Telefone Principal", card.telefoneContato, isPhone = true)
                            }
                            if (!card.telefoneOpcional.isNullOrBlank()) {
                                DetailItem("Telefone Opcional", card.telefoneOpcional, isPhone = true)
                            }
                            if (!card.emailCliente.isNullOrBlank()) {
                                DetailItem("Email do Cliente", card.emailCliente, isEmail = true)
                            }
                        }
                    }
                    
                    // Endereços
                    DetailSection(
                        title = "Endereços",
                        icon = Icons.Default.LocationOn
                    ) {
                        DetailItem("Endereço de Cadastro", card.enderecoCadastro ?: "Não informado")
                        DetailItem("Endereço de Recolha", card.enderecoRecolha ?: "Não informado")
                        
                        if (!card.linkMapa.isNullOrBlank()) {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        try {
                                            uriHandler.openUri(card.linkMapa)
                                        } catch (e: Exception) {
                                            // Ignorar erro ao abrir link
                                        }
                                    },
                                colors = CardDefaults.cardColors(
                                    containerColor = Color(0xFF3498DB).copy(alpha = 0.1f)
                                ),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Map,
                                        contentDescription = null,
                                        tint = Color(0xFF3498DB),
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Text(
                                        text = "Abrir no Mapa",
                                        color = Color(0xFF3498DB),
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
                        }
                    }
                    
                    // Informações financeiras
                    if (!card.valorRecolha.isNullOrBlank() || !card.custoKmAdicional.isNullOrBlank()) {
                        DetailSection(
                            title = "Informações Financeiras",
                            icon = Icons.Default.AttachMoney
                        ) {
                            if (!card.valorRecolha.isNullOrBlank()) {
                                DetailItem("Valor da Recolha", card.valorRecolha)
                            }
                            if (!card.custoKmAdicional.isNullOrBlank()) {
                                DetailItem("Custo por KM Adicional", card.custoKmAdicional)
                            }
                        }
                    }
                    
                    // Informações da tarefa
                    DetailSection(
                        title = "Informações da Tarefa",
                        icon = Icons.Default.Assignment
                    ) {
                        DetailItem("ID da Tarefa", card.id)
                        DetailItem("Fase Atual", card.faseAtual)
                        DetailItem("Data de Criação", formatDetailDate(card.dataCriacao))
                        
                        if (!card.urlPublica.isNullOrBlank()) {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        try {
                                            uriHandler.openUri(card.urlPublica)
                                        } catch (e: Exception) {
                                            // Ignorar erro ao abrir link
                                        }
                                    },
                                colors = CardDefaults.cardColors(
                                    containerColor = Color(0xFF9B59B6).copy(alpha = 0.1f)
                                ),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.OpenInNew,
                                        contentDescription = null,
                                        tint = Color(0xFF9B59B6),
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Text(
                                        text = "Abrir URL Pública",
                                        color = Color(0xFF9B59B6),
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
                        }
                    }
                    
                    // Espaçamento extra no final
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}

@Composable
private fun DetailSection(
    title: String,
    icon: ImageVector,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFFF8F9FA)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = Color(0xFF667eea),
                    modifier = Modifier.size(20.dp)
                )
                Text(
                    text = title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF2C3E50)
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            content()
        }
    }
}

@Composable
private fun DetailItem(
    label: String,
    value: String,
    isEmail: Boolean = false,
    isPhone: Boolean = false
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Text(
            text = label,
            fontSize = 12.sp,
            color = Color.Gray,
            fontWeight = FontWeight.Medium
        )
        Text(
            text = value,
            fontSize = 14.sp,
            color = if (isEmail || isPhone) Color(0xFF3498DB) else Color(0xFF2C3E50),
            fontWeight = FontWeight.Medium,
            maxLines = if (isEmail) 1 else Int.MAX_VALUE,
            overflow = if (isEmail) TextOverflow.Ellipsis else TextOverflow.Clip
        )
    }
}

private fun parseColor(colorString: String): Color {
    return try {
        Color(android.graphics.Color.parseColor(colorString))
    } catch (e: Exception) {
        Color.Gray
    }
}

private fun formatDetailDate(dateString: String): String {
    return try {
        val date = LocalDateTime.parse(dateString.replace("Z", ""), DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm"))
    } catch (e: Exception) {
        dateString
    }
}