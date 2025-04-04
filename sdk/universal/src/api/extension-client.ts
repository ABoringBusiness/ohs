import { ExtensionContext, ContextData } from '../types';
import { ConversationService } from './conversation-service';

/**
 * Client for browser extension integrations
 */
export class ExtensionClient {
  private conversationService: ConversationService;

  constructor(conversationService: ConversationService) {
    this.conversationService = conversationService;
  }

  /**
   * Extract context from the current page
   * This should be called from a content script
   */
  extractPageContext(): ContextData {
    if (typeof document === 'undefined') {
      throw new Error('Cannot extract page context: document is not defined');
    }
    
    return {
      url: window.location.href,
      title: document.title,
      text: document.body.innerText.substring(0, 5000), // Limit text size
    };
  }

  /**
   * Extract selected text from the current page
   * This should be called from a content script
   */
  extractSelectedText(): string {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      throw new Error('Cannot extract selected text: document or window is not defined');
    }
    
    const selection = window.getSelection();
    return selection ? selection.toString() : '';
  }

  /**
   * Ask a question about the current page
   */
  async askAboutPage(
    question: string,
    context: ExtensionContext,
    conversationId?: string
  ): Promise<{ answer: string; conversationId: string }> {
    // Prepare context data
    const contextData: ContextData = {
      url: context.url,
      title: context.title,
      text: context.pageContent || context.selectedText,
    };
    
    // Send the question with context
    const result = await this.conversationService.ask(question, contextData, conversationId);
    
    return {
      answer: result.message.content,
      conversationId: result.conversation.id,
    };
  }

  /**
   * Inject UI elements into the page
   * This should be called from a content script
   */
  injectUI(elementId: string, html: string): HTMLElement {
    if (typeof document === 'undefined') {
      throw new Error('Cannot inject UI: document is not defined');
    }
    
    // Check if element already exists
    let element = document.getElementById(elementId);
    
    if (!element) {
      // Create new element
      element = document.createElement('div');
      element.id = elementId;
      document.body.appendChild(element);
    }
    
    // Set HTML content
    element.innerHTML = html;
    
    return element;
  }

  /**
   * Remove injected UI elements
   * This should be called from a content script
   */
  removeUI(elementId: string): void {
    if (typeof document === 'undefined') {
      throw new Error('Cannot remove UI: document is not defined');
    }
    
    const element = document.getElementById(elementId);
    if (element) {
      element.remove();
    }
  }

  /**
   * Send a message to the background script
   * This should be called from a content script
   */
  async sendToBackground(message: any): Promise<any> {
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      throw new Error('Cannot send message: chrome.runtime is not defined');
    }
    
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Execute a script in the current tab
   * This should be called from a background script
   */
  async executeScript(tabId: number, func: () => any): Promise<any> {
    if (typeof chrome === 'undefined' || !chrome.scripting) {
      throw new Error('Cannot execute script: chrome.scripting is not defined');
    }
    
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func,
    });
    
    return results[0].result;
  }
}