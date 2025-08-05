package com.example.kanbanmobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import com.example.kanbanmobile.ui.theme.KanbanMobileTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            KanbanMobileTheme {
                Surface(color = MaterialTheme.colorScheme.background) {
                    Text(text = "Hello Kanban Mobile!")
                }
            }
        }
    }
}