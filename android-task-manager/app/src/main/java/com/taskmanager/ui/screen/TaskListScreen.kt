package com.taskmanager.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.taskmanager.domain.model.Card
import com.taskmanager.ui.component.TaskCard
import com.taskmanager.ui.component.TaskHeader
import com.taskmanager.ui.component.TaskFilterPanel
import com.taskmanager.ui.component.TaskDetailsModal
import com.taskmanager.ui.viewmodel.TaskViewModel
import com.taskmanager.ui.viewmodel.AuthViewModel

@OptIn(ExperimentalMaterialApi::class, ExperimentalMaterial3Api::class)
@Composable
fun TaskListScreen(
    onLogout: () -> Unit,
    taskViewModel: TaskViewModel = hiltViewModel(),
    authViewModel: AuthViewModel = hiltViewModel()
) {
    val taskUiState by taskViewModel.uiState.collectAsStateWithLifecycle()
    val isLoading by taskViewModel.isLoading.collectAsStateWithLifecycle()
    val error by taskViewModel.error.collectAsStateWithLifecycle()
    val filteredCards by taskViewModel.filteredCards.collectAsStateWithLifecycle()
    val currentUser by authViewModel.currentUser.collectAsStateWithLifecycle()
    
    // Estados para pull-to-refresh
    val pullRefreshState = rememberPullRefreshState(
        refreshing = isLoading,
        onRefresh = { taskViewModel.refreshTasks() }
    )
    
    LaunchedEffect(Unit) {
        taskViewModel.loadTasks()
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF5F5F5))
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Header
            TaskHeader(
                user = currentUser,
                isLoading = isLoading,
                onFilterClick = { taskViewModel.toggleFilterPanel() },
                onLogoutClick = { 
                    authViewModel.logout()
                    onLogout()
                }
            )
            
            // Painel de filtros
            if (taskUiState.isFilterPanelOpen) {
                TaskFilterPanel(
                    validPhases = taskViewModel.getValidPhases(),
                    currentPhase = taskViewModel.getCurrentSelectedPhase(),
                    searchQuery = taskViewModel.getCurrentSearchQuery(),
                    onPhaseSelected = { phase ->
                        taskViewModel.filterByPhase(phase)
                    },
                    onSearchChanged = { query ->
                        taskViewModel.searchTasks(query)
                    },
                    onCloseFilter = { taskViewModel.toggleFilterPanel() }
                )
            }
            
            // Lista de cards
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .pullRefresh(pullRefreshState)
            ) {
                if (filteredCards.isEmpty() && !isLoading) {
                    // Estado vazio
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Assignment,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = Color.Gray
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Nenhuma tarefa encontrada",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color.Gray
                        )
                        Text(
                            text = "Tente ajustar os filtros ou aguarde novas tarefas",
                            fontSize = 14.sp,
                            color = Color.Gray,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(
                            items = filteredCards,
                            key = { card -> card.id }
                        ) { card ->
                            TaskCard(
                                card = card,
                                phaseColor = taskViewModel.getPhaseColor(card.faseAtual),
                                adaptedPhaseName = taskViewModel.getAdaptedPhaseName(card.faseAtual),
                                onClick = { taskViewModel.openCardDetails(card) }
                            )
                        }
                        
                        // Espaçamento extra no final
                        item {
                            Spacer(modifier = Modifier.height(16.dp))
                        }
                    }
                }
                
                // Indicador de pull-to-refresh
                PullRefreshIndicator(
                    refreshing = isLoading,
                    state = pullRefreshState,
                    modifier = Modifier.align(Alignment.TopCenter),
                    backgroundColor = Color.White,
                    contentColor = Color(0xFF667eea)
                )
            }
        }
        
        // Modal de detalhes da tarefa
        if (taskUiState.isCardDetailsOpen && taskUiState.selectedCard != null) {
            TaskDetailsModal(
                card = taskUiState.selectedCard,
                phaseColor = taskViewModel.getPhaseColor(taskUiState.selectedCard.faseAtual),
                adaptedPhaseName = taskViewModel.getAdaptedPhaseName(taskUiState.selectedCard.faseAtual),
                onDismiss = { taskViewModel.closeCardDetails() }
            )
        }
        
        // Snackbar para erros
        error?.let { errorMessage ->
            LaunchedEffect(errorMessage) {
                // Aqui você pode implementar um SnackbarHost se quiser
                // Por agora, vamos limpar o erro após mostrar
                taskViewModel.clearError()
            }
        }
    }
}