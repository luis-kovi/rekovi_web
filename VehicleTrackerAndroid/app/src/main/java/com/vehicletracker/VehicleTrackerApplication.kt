package com.vehicletracker

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class VehicleTrackerApplication : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}