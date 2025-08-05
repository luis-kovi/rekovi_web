package com.vehicletracker.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.vehicletracker.ui.theme.GradientEnd
import com.vehicletracker.ui.theme.GradientStart
import com.vehicletracker.ui.theme.PhaseColors
import com.vehicletracker.viewmodel.VehicleDetailViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VehicleDetailScreen(
    vehicleId: String,
    onBackClick: () -> Unit,
    viewModel: VehicleDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    
    LaunchedEffect(vehicleId) {
        viewModel.loadVehicle(vehicleId)
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(GradientStart, GradientEnd)
                )
            )
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { 
                        Text(
                            text = uiState.vehicle?.licensePlate ?: "Detalhes",
                            fontWeight = FontWeight.Bold
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = onBackClick) {
                            Icon(
                                imageVector = Icons.Default.ArrowBack,
                                contentDescription = "Voltar"
                            )
                        }
                    },
                    actions = {
                        IconButton(onClick = { /* Share action */ }) {
                            Icon(
                                imageVector = Icons.Default.Share,
                                contentDescription = "Compartilhar"
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color.Transparent
                    )
                )
            },
            containerColor = Color.Transparent
        ) { paddingValues ->
            if (uiState.isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (uiState.vehicle != null) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .verticalScroll(rememberScrollState())
                ) {
                    val vehicle = uiState.vehicle
                    val phaseColor = PhaseColors[vehicle.currentPhase] ?: MaterialTheme.colorScheme.primary
                    
                    // Phase Card
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = phaseColor.copy(alpha = 0.1f)
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(
                                    text = "Fase Atual",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = phaseColor
                                )
                                Text(
                                    text = vehicle.currentPhase,
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = phaseColor
                                )
                            }
                            Icon(
                                imageVector = getPhaseIcon(vehicle.currentPhase),
                                contentDescription = null,
                                tint = phaseColor,
                                modifier = Modifier.size(48.dp)
                            )
                        }
                    }
                    
                    // Vehicle Info Card
                    DetailCard(
                        title = "Informações do Veículo",
                        icon = Icons.Default.DirectionsCar
                    ) {
                        DetailRow("Placa", vehicle.licensePlate)
                        DetailRow("Modelo", vehicle.vehicleModel)
                        DetailRow("Origem", vehicle.rentalOrigin)
                        DetailRow("Data de Criação", formatDate(vehicle.createdAt))
                    }
                    
                    // Driver Info Card
                    DetailCard(
                        title = "Motorista",
                        icon = Icons.Default.Person
                    ) {
                        DetailRow("Nome", vehicle.driverName.ifBlank { "Não informado" })
                        DetailRow(
                            "E-mail", 
                            vehicle.customerEmail.ifBlank { "Não informado" },
                            clickable = vehicle.customerEmail.isNotBlank(),
                            onClick = {
                                val intent = Intent(Intent.ACTION_SENDTO).apply {
                                    data = Uri.parse("mailto:${vehicle.customerEmail}")
                                }
                                context.startActivity(intent)
                            }
                        )
                    }
                    
                    // Collector Info Card
                    DetailCard(
                        title = "Chofer de Recolha",
                        icon = Icons.Default.LocalShipping
                    ) {
                        DetailRow("Nome", vehicle.collectorName.ifBlank { "Não atribuído" })
                        DetailRow(
                            "E-mail", 
                            vehicle.collectorEmail.ifBlank { "Não informado" },
                            clickable = vehicle.collectorEmail.isNotBlank(),
                            onClick = {
                                val intent = Intent(Intent.ACTION_SENDTO).apply {
                                    data = Uri.parse("mailto:${vehicle.collectorEmail}")
                                }
                                context.startActivity(intent)
                            }
                        )
                        DetailRow("Empresa", vehicle.responsibleCompany)
                    }
                    
                    // Contact Info Card
                    DetailCard(
                        title = "Contatos",
                        icon = Icons.Default.Phone
                    ) {
                        DetailRow(
                            "Telefone Principal", 
                            vehicle.contactPhone.ifBlank { "Não informado" },
                            clickable = vehicle.contactPhone.isNotBlank(),
                            onClick = {
                                val intent = Intent(Intent.ACTION_DIAL).apply {
                                    data = Uri.parse("tel:${vehicle.contactPhone}")
                                }
                                context.startActivity(intent)
                            }
                        )
                        vehicle.optionalPhone?.let { phone ->
                            DetailRow(
                                "Telefone Opcional", 
                                phone,
                                clickable = true,
                                onClick = {
                                    val intent = Intent(Intent.ACTION_DIAL).apply {
                                        data = Uri.parse("tel:$phone")
                                    }
                                    context.startActivity(intent)
                                }
                            )
                        }
                    }
                    
                    // Address Info Card
                    DetailCard(
                        title = "Endereços",
                        icon = Icons.Default.LocationOn
                    ) {
                        DetailRow("Endereço de Cadastro", vehicle.registrationAddress)
                        DetailRow("Endereço de Recolha", vehicle.collectionAddress)
                        vehicle.mapLink?.let { link ->
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(
                                onClick = {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(link))
                                    context.startActivity(intent)
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = MaterialTheme.colorScheme.primary
                                )
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Map,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Abrir no Mapa")
                            }
                        }
                    }
                    
                    // Financial Info Card
                    if (!vehicle.collectionValue.isNullOrBlank() || !vehicle.additionalKmCost.isNullOrBlank()) {
                        DetailCard(
                            title = "Informações Financeiras",
                            icon = Icons.Default.AttachMoney
                        ) {
                            vehicle.collectionValue?.let {
                                DetailRow("Valor de Recolha", it)
                            }
                            vehicle.additionalKmCost?.let {
                                DetailRow("Custo KM Adicional", it)
                            }
                        }
                    }
                    
                    // Actions
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = { /* Update phase action */ },
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Update,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Atualizar Fase")
                        }
                        
                        Button(
                            onClick = { /* Complete action */ },
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Concluir")
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(32.dp))
                }
            } else {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Veículo não encontrado",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
private fun DetailCard(
    title: String,
    icon: ImageVector,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            content()
        }
    }
}

@Composable
private fun DetailRow(
    label: String,
    value: String,
    clickable: Boolean = false,
    onClick: () -> Unit = {}
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .then(
                if (clickable) Modifier.clickable { onClick() }
                else Modifier
            ),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            color = if (clickable) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
        )
    }
}

private fun getPhaseIcon(phase: String): ImageVector {
    return when (phase) {
        "Fila de Recolha" -> Icons.Default.Schedule
        "Aprovar Custo de Recolha" -> Icons.Default.AttachMoney
        "Tentativa 1 de Recolha", "Tentativa 2 de Recolha", "Tentativa 3 de Recolha" -> Icons.Default.DirectionsCar
        "Desbloquear Veículo" -> Icons.Default.Lock
        "Solicitar Guincho" -> Icons.Default.CarRepair
        "Nova tentativa de recolha" -> Icons.Default.Refresh
        "Confirmação de Entrega no Pátio" -> Icons.Default.CheckCircle
        else -> Icons.Default.DirectionsCar
    }
}

private fun formatDate(date: Date): String {
    return SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(date)
}