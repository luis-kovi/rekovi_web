package com.taskmanager.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskFilterPanel(
    validPhases: List<String>,
    currentPhase: String,
    searchQuery: String,
    onPhaseSelected: (String) -> Unit,
    onSearchChanged: (String) -> Unit,
    onCloseFilter: () -> Unit,
    modifier: Modifier = Modifier
) {
    val keyboardController = LocalSoftwareKeyboardController.current
    
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(bottomStart = 16.dp, bottomEnd = 16.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header do painel
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Filtros e Busca",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF2C3E50)
                )
                
                IconButton(
                    onClick = onCloseFilter
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Fechar filtros",
                        tint = Color.Gray
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Campo de busca
            OutlinedTextField(
                value = searchQuery,
                onValueChange = onSearchChanged,
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Buscar por placa, driver, chofer...") },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = null,
                        tint = Color.Gray
                    )
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(
                            onClick = { onSearchChanged("") }
                        ) {
                            Icon(
                                imageVector = Icons.Default.Clear,
                                contentDescription = "Limpar busca",
                                tint = Color.Gray
                            )
                        }
                    }
                },
                keyboardOptions = KeyboardOptions(
                    imeAction = ImeAction.Search
                ),
                keyboardActions = KeyboardActions(
                    onSearch = { keyboardController?.hide() }
                ),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFF667eea),
                    focusedLabelColor = Color(0xFF667eea)
                )
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Filtros por fase
            Text(
                text = "Filtrar por Fase:",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = Color(0xFF2C3E50)
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(horizontal = 0.dp)
            ) {
                // Opção "Todas"
                item {
                    FilterChip(
                        selected = currentPhase == "all",
                        onClick = { onPhaseSelected("all") },
                        label = {
                            Text(
                                text = "Todas",
                                fontSize = 12.sp,
                                fontWeight = if (currentPhase == "all") FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color(0xFF667eea),
                            selectedLabelColor = Color.White,
                            containerColor = Color.Transparent,
                            labelColor = Color.Gray
                        ),
                        border = FilterChipDefaults.filterChipBorder(
                            enabled = true,
                            selected = currentPhase == "all",
                            borderColor = if (currentPhase == "all") Color(0xFF667eea) else Color.Gray,
                            selectedBorderColor = Color(0xFF667eea)
                        )
                    )
                }
                
                // Filtros por fase específica
                items(validPhases) { phase ->
                    FilterChip(
                        selected = currentPhase == phase,
                        onClick = { onPhaseSelected(phase) },
                        label = {
                            Text(
                                text = getAdaptedPhaseName(phase),
                                fontSize = 12.sp,
                                fontWeight = if (currentPhase == phase) FontWeight.Bold else FontWeight.Normal,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color(0xFF667eea),
                            selectedLabelColor = Color.White,
                            containerColor = Color.Transparent,
                            labelColor = Color.Gray
                        ),
                        border = FilterChipDefaults.filterChipBorder(
                            enabled = true,
                            selected = currentPhase == phase,
                            borderColor = if (currentPhase == phase) Color(0xFF667eea) else Color.Gray,
                            selectedBorderColor = Color(0xFF667eea)
                        )
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Ações do painel
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Botão limpar todos os filtros
                OutlinedButton(
                    onClick = {
                        onSearchChanged("")
                        onPhaseSelected("all")
                    },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = Color.Gray
                    ),
                    border = ButtonDefaults.outlinedButtonBorder.copy(
                        brush = null,
                        width = 1.dp
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Limpar Filtros")
                }
                
                // Botão aplicar (apenas visual, filtros são aplicados em tempo real)
                Button(
                    onClick = onCloseFilter,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF667eea)
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Aplicar")
                }
            }
        }
    }
}

private fun getAdaptedPhaseName(phase: String): String {
    return when (phase) {
        "Fila de Recolha" -> "Aguardando"
        "Aprovar Custo de Recolha" -> "Aprovação"
        "Tentativa 1 de Recolha" -> "Tentativa 1"
        "Tentativa 2 de Recolha" -> "Tentativa 2"
        "Tentativa 3 de Recolha" -> "Tentativa 3"
        "Desbloquear Veículo" -> "Desbloqueio"
        "Solicitar Guincho" -> "Guincho"
        "Nova tentativa de recolha" -> "Nova Tentativa"
        "Confirmação de Entrega no Pátio" -> "Entregue"
        else -> phase
    }
}