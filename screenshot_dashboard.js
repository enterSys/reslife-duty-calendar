const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the dashboard
    await page.goto('https://reslifecal.vercel.app/dashboard');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Check if we're on the login page
    const loginButton = await page.locator('button:has-text("Sign in")').first();
    if (await loginButton.count() > 0) {
      console.log('On login page, filling in credentials...');
      
      // Fill in email
      await page.fill('input[type="email"]', 'mahzeyarmaroufi@gmail.com');
      
      // Fill in password
      await page.fill('input[type="password"]', 'KMG_wxm5fjh8zne1ndm');
      
      // Click sign in
      await loginButton.click();
      
      // Wait for redirect to dashboard
      await page.waitForTimeout(3000);
      
      // Check if we're now on the dashboard
      const currentUrl = page.url();
      if (!currentUrl.includes('dashboard')) {
        console.log('Navigating to dashboard...');
        await page.goto('https://reslifecal.vercel.app/dashboard');
        await page.waitForTimeout(2000);
      }
    }
    
    // Wait for the My Duties section to load
    await page.waitForSelector('h2:has-text("My Duties"), h3:has-text("My Duties")', { timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ 
      path: 'dashboard_screenshot.png', 
      fullPage: true 
    });
    
    console.log('Screenshot saved as dashboard_screenshot.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();