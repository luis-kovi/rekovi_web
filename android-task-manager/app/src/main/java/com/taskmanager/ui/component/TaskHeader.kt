package com.taskmanager.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.taskmanager.domain.model.User
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskHeader(
    user: User?,
    isLoading: Boolean,
    onFilterClick: () -> Unit,
    onLogoutClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showUserMenu by remember { mutableStateOf(false) }
    val currentTime = remember {
        LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm"))
    }
    
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(bottomStart = 16.dp, bottomEnd = 16.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF667eea)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Status bar info
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Indicador de conexão
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .background(
                                color = if (isLoading) Color.Orange else Color.Green,
                                shape = CircleShape
                            )
                    )
                    Text(
                        text = if (isLoading) "Sincronizando..." else "Conectado",
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.9f)
                    )
                }
                
                // Última atualização
                Text(
                    text = "Atualizado às $currentTime",
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.7f)
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Header principal
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Informações do usuário
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = "Olá, ${getUserDisplayName(user)}!",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = getPermissionDisplayText(user?.appMetadata?.permissionType),
                        fontSize = 14.sp,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                }
                
                // Ações do header
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Botão de filtro
                    IconButton(
                        onClick = onFilterClick,
                        modifier = Modifier
                            .background(
                                color = Color.White.copy(alpha = 0.2f),
                                shape = CircleShape
                            )
                    ) {
                        Icon(
                            imageVector = Icons.Default.FilterList,
                            contentDescription = "Filtros",
                            tint = Color.White
                        )
                    }
                    
                    // Menu do usuário
                    Box {
                        IconButton(
                            onClick = { showUserMenu = true },
                            modifier = Modifier
                                .background(
                                    color = Color.White.copy(alpha = 0.2f),
                                    shape = CircleShape
                                )
                        ) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = "Menu do usuário",
                                tint = Color.White
                            )
                        }
                        
                        DropdownMenu(
                            expanded = showUserMenu,
                            onDismissRequest = { showUserMenu = false }
                        ) {
                            DropdownMenuItem(
                                text = {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Person,
                                            contentDescription = null,
                                            modifier = Modifier.size(20.dp)
                                        )
                                        Column {
                                            Text(
                                                text = getUserDisplayName(user),
                                                fontWeight = FontWeight.Medium
                                            )
                                            Text(
                                                text = user?.email ?: "",
                                                fontSize = 12.sp,
                                                color = Color.Gray
                                            )
                                        }
                                    }
                                },
                                onClick = { /* Perfil do usuário */ }
                            )
                            
                            Divider()
                            
                            DropdownMenuItem(
                                text = {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.ExitToApp,
                                            contentDescription = null,
                                            modifier = Modifier.size(20.dp),
                                            tint = Color.Red
                                        )
                                        Text(
                                            text = "Sair",
                                            color = Color.Red
                                        )
                                    }
                                },
                                onClick = {
                                    showUserMenu = false
                                    onLogoutClick()
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun getUserDisplayName(user: User?): String {
    return user?.userMetadata?.fullName?.split(" ")?.firstOrNull() 
        ?: user?.email?.split("@")?.firstOrNull()?.replaceFirstChar { it.uppercase() }
        ?: "Usuário"
}

private fun getPermissionDisplayText(permissionType: String?): String {
    return when (permissionType?.lowercase()) {
        "admin" -> "Administrador"
        "kovi" -> "Kovi - Acesso Completo"
        "ativa" -> "Ativa - Parceiro"
        "onsystem" -> "OnSystem - Parceiro" 
        "chofer" -> "Chofer - Operacional"
        else -> "Usuário"
    }
}