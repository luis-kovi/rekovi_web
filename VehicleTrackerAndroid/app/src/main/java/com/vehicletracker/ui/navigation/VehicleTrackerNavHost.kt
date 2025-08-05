package com.vehicletracker.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.vehicletracker.ui.screens.VehicleDetailScreen
import com.vehicletracker.ui.screens.VehicleListScreen
import com.vehicletracker.ui.screens.LoginScreen

@Composable
fun VehicleTrackerNavHost(
    navController: NavHostController,
    startDestination: String = NavigationRoutes.Login.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(NavigationRoutes.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(NavigationRoutes.VehicleList.route) {
                        popUpTo(NavigationRoutes.Login.route) { inclusive = true }
                    }
                }
            )
        }
        
        composable(NavigationRoutes.VehicleList.route) {
            VehicleListScreen(
                onVehicleClick = { vehicleId ->
                    navController.navigate(NavigationRoutes.VehicleDetail.createRoute(vehicleId))
                },
                onLogout = {
                    navController.navigate(NavigationRoutes.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
        
        composable(
            route = NavigationRoutes.VehicleDetail.route,
            arguments = NavigationRoutes.VehicleDetail.arguments
        ) { backStackEntry ->
            val vehicleId = backStackEntry.arguments?.getString("vehicleId") ?: ""
            VehicleDetailScreen(
                vehicleId = vehicleId,
                onBackClick = {
                    navController.popBackStack()
                }
            )
        }
    }
}