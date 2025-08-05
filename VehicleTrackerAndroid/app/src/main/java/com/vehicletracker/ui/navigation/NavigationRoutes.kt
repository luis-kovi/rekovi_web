package com.vehicletracker.ui.navigation

import androidx.navigation.NavType
import androidx.navigation.navArgument

sealed class NavigationRoutes(val route: String) {
    object Login : NavigationRoutes("login")
    
    object VehicleList : NavigationRoutes("vehicle_list")
    
    object VehicleDetail : NavigationRoutes("vehicle_detail/{vehicleId}") {
        fun createRoute(vehicleId: String) = "vehicle_detail/$vehicleId"
        
        val arguments = listOf(
            navArgument("vehicleId") { type = NavType.StringType }
        )
    }
}