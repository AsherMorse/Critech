import { Box, AppBar, Toolbar, Typography, Paper, ThemeProvider, createTheme, BottomNavigation, BottomNavigationAction } from '@mui/material'
import { AccountCircle, Home } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import HomeView from '../components/HomeView'
import ProfileView from '../components/ProfileView'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1e88e5',
      dark: '#1565c0',
      light: '#42a5f5'
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e'
    }
  }
})

const navigationTabs = [
  {
    label: 'Home',
    icon: <Home />,
    component: <HomeView />
  },
  {
    label: 'Profile', 
    icon: <AccountCircle />,
    component: <ProfileView />
  }
]

export default function Dashboard() {
  const [value, setValue] = useState(0)

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top App Bar */}
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {navigationTabs[value].label}
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          pb: 8 // Add padding to bottom to account for tab bar
        }}>
          {navigationTabs[value].component}
        </Box>

        {/* Bottom Navigation Bar */}
        <Paper 
          elevation={8}
          sx={{ 
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            borderRadius: '16px 16px 0 0',
            bgcolor: 'background.paper',
            overflow: 'hidden'
          }}
        >
          <BottomNavigation
            value={value}
            onChange={(event, newValue) => {
              setValue(newValue)
            }}
            sx={{
              bgcolor: 'background.paper',
              '& .MuiBottomNavigationAction-root': {
                color: 'text.secondary'
              },
              '& .Mui-selected': {
                color: 'primary.main'
              }
            }}
          >
            {navigationTabs.map((tab, index) => (
              <BottomNavigationAction 
                key={tab.label}
                label={tab.label} 
                icon={tab.icon}
                disableRipple 
              />
            ))}
          </BottomNavigation>
        </Paper>
      </Box>
    </ThemeProvider>
  )
} 