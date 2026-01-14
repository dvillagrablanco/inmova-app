import { test, expect } from '@playwright/test';

test.describe('Mobile Floating Buttons', () => {
  test.use({
    viewport: { width: 390, height: 844 }, // iPhone 12/13/14
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  });

  test('should display floating buttons correctly positioned on mobile', async ({ page }) => {
    // Navigate to landing page
    await page.goto('https://inmovaapp.com/');
    
    // Wait for hydration and dynamic components
    await page.waitForLoadState('networkidle');
    
    // Selectors
    const whatsappSelector = '.whatsapp-button';
    const chatbotSelector = '.inmova-chatbot-button';
    // Crisp often injects an iframe or div with specific classes, usually id="crisp-chatbox" or class="crisp-client"
    // We'll look for the container usually injected
    const crispSelector = '.crisp-client'; 

    // Check visibility
    // Note: Crisp might take longer to load or might not be in DOM immediately if lazy loaded
    // We will focus on our controlled buttons first
    
    await page.waitForSelector(whatsappSelector, { state: 'visible', timeout: 10000 });
    await page.waitForSelector(chatbotSelector, { state: 'visible', timeout: 10000 });

    const whatsappBox = await page.locator(whatsappSelector).boundingBox();
    const chatbotBox = await page.locator(chatbotSelector).boundingBox();
    
    console.log('WhatsApp Box:', whatsappBox);
    console.log('Chatbot Box:', chatbotBox);

    // Basic assertions for existence
    expect(whatsappBox).not.toBeNull();
    expect(chatbotBox).not.toBeNull();

    // Check for overlaps
    if (whatsappBox && chatbotBox) {
        // Simple overlap check
        const overlap = !(whatsappBox.x + whatsappBox.width < chatbotBox.x ||
                          chatbotBox.x + chatbotBox.width < whatsappBox.x ||
                          whatsappBox.y + whatsappBox.height < chatbotBox.y ||
                          chatbotBox.y + chatbotBox.height < whatsappBox.y);
        
        console.log('Overlap detected:', overlap);
        expect(overlap).toBeFalsy();
    }
    
    // Check if they are near the bottom right (standard mobile interaction zone)
    // 390 width, 844 height
    if (whatsappBox) {
        expect(whatsappBox.y).toBeGreaterThan(600); // Should be in the bottom part
        expect(whatsappBox.x).toBeGreaterThan(200); // Should be on the right side
    }
  });
});
