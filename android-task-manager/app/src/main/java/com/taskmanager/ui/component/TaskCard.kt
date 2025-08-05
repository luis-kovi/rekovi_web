package com.taskmanager.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.taskmanager.domain.model.Card
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskCard(
    card: Card,
    phaseColor: String,
    adaptedPhaseName: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header do card com placa e status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                // Placa do veículo
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = card.placa.uppercase(),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF2C3E50)
                    )
                    Text(
                        text = card.modeloVeiculo ?: "Modelo não informado",
                        fontSize = 12.sp,
                        color = Color.Gray,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                
                // Status/Fase
                Box(
                    modifier = Modifier
                        .background(
                            color = parseColor(phaseColor).copy(alpha = 0.1f),
                            shape = RoundedCornerShape(16.dp)
                        )
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = getPhaseIcon(card.faseAtual),
                            contentDescription = null,
                            modifier = Modifier.size(14.dp),
                            tint = parseColor(phaseColor)
                        )
                        Text(
                            text = adaptedPhaseName,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = parseColor(phaseColor)
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Informações do motorista e chofer
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Driver
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp),
                            tint = Color.Gray
                        )
                        Text(
                            text = "Driver",
                            fontSize = 11.sp,
                            color = Color.Gray,
                            fontWeight = FontWeight.Medium
                        )
                    }
                    Text(
                        text = card.nomeDriver.ifBlank { "Não informado" },
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color(0xFF34495E),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                
                // Chofer
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.DirectionsCar,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp),
                            tint = Color.Gray
                        )
                        Text(
                            text = "Chofer",
                            fontSize = 11.sp,
                            color = Color.Gray,
                            fontWeight = FontWeight.Medium
                        )
                    }
                    Text(
                        text = card.chofer.ifBlank { "Não informado" },
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color(0xFF34495E),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Footer com empresa e data
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Empresa
                Text(
                    text = card.empresaResponsavel?.uppercase() ?: "SEM EMPRESA",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (card.empresaResponsavel != null) Color(0xFF3498DB) else Color.Gray,
                    modifier = Modifier.weight(1f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                
                // Data formatada
                Text(
                    text = formatDate(card.dataCriacao),
                    fontSize = 11.sp,
                    color = Color.Gray
                )
            }
        }
    }
}

private fun getPhaseIcon(phase: String): ImageVector {
    return when (phase) {
        "Fila de Recolha" -> Icons.Default.Schedule
        "Aprovar Custo de Recolha" -> Icons.Default.CheckCircle
        "Tentativa 1 de Recolha", "Tentativa 2 de Recolha", "Tentativa 3 de Recolha" -> Icons.Default.FlashOn
        "Desbloquear Veículo" -> Icons.Default.Lock
        "Solicitar Guincho" -> Icons.Default.Build
        "Nova tentativa de recolha" -> Icons.Default.Refresh
        "Confirmação de Entrega no Pátio" -> Icons.Default.CheckCircle
        else -> Icons.Default.Assignment
    }
}

private fun parseColor(colorString: String): Color {
    return try {
        Color(android.graphics.Color.parseColor(colorString))
    } catch (e: Exception) {
        Color.Gray
    }
}

private fun formatDate(dateString: String): String {
    return try {
        val date = LocalDateTime.parse(dateString.replace("Z", ""), DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        val now = LocalDateTime.now()
        val diffDays = ChronoUnit.DAYS.between(date.toLocalDate(), now.toLocalDate())
        
        when {
            diffDays == 0L -> "Hoje"
            diffDays == 1L -> "Ontem"
            diffDays <= 7L -> "${diffDays} dias atrás"
            else -> date.format(DateTimeFormatter.ofPattern("dd/MM/yy"))
        }
    } catch (e: Exception) {
        "Data inválida"
    }
}