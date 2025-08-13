# PowerShell script to clean up git repository
Write-Host "Cleaning up git repository..." -ForegroundColor Green

# Remove node_modules from git tracking
Write-Host "Removing node_modules from git tracking..." -ForegroundColor Yellow
git rm -r --cached node_modules 2>$null

# Clean up any other large files that might be cached
Write-Host "Cleaning git cache..." -ForegroundColor Yellow
git gc --prune=now

# Add all changes
Write-Host "Adding changes..." -ForegroundColor Yellow
git add .

# Commit the cleanup
Write-Host "Committing cleanup..." -ForegroundColor Yellow
git commit -m "Remove node_modules and clean up repository"

Write-Host "Repository cleanup completed!" -ForegroundColor Green
Write-Host "You can now try pushing again with: git push origin master" -ForegroundColor Cyan
