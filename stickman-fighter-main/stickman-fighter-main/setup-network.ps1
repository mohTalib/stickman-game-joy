# Run this script as administrator to configure firewall rules for the game
Write-Host "Setting up firewall rules for Stick Fighter Game..."

# Remove existing rules if they exist
Remove-NetFirewallRule -DisplayName "Stick Fighter - TCP 5000" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Stick Fighter - UDP 5000" -ErrorAction SilentlyContinue

# Add new inbound rules
New-NetFirewallRule -DisplayName "Stick Fighter - TCP 5000" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Stick Fighter - UDP 5000" -Direction Inbound -LocalPort 5000 -Protocol UDP -Action Allow

Write-Host "Firewall rules have been created successfully!"
Write-Host "The game server should now be accessible from other devices on your network."