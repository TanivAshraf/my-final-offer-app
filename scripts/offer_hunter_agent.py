# =============================================================================
# OFFER HUNTER AI AGENT - FINAL PRODUCTION SCRIPT
# =============================================================================

# --- Step 1: Import all necessary tools ---
import time
import json
import os # A tool to get our secret keys from the environment

# Selenium browser tools
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

# BeautifulSoup for cleaning HTML
from bs4 import BeautifulSoup

# LangChain AI tools
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Supabase database tool
from supabase import create_client, Client

# --- Step 2: Get our secret keys securely from the environment ---
# GitHub Actions will provide these to our script
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

# --- Tool #1: The "Hunter" (Selenium version) ---
def scrape_url(url):
    print(f"--- Visiting with a real browser: {url} ---")
    try:
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        # This is the standard setup for Selenium in a GitHub Actions runner
        service = Service()
        
        driver = webdriver.Chrome(service=service, options=chrome_options)
        driver.get(url)
        time.sleep(5)
        html_content = driver.page_source
        driver.quit()
        soup = BeautifulSoup(html_content, 'html.parser')
        return soup.get_text(separator='\n', strip=True)
    except Exception as e:
        print(f"!!! ERROR: The browser failed. Reason: {e} !!!")
        if 'driver' in locals():
            driver.quit()
        return None

# --- Tool #2: The "Analyst" (Our AI Brain) ---
def find_offers_in_text(text_data, api_key, source_url):
    print("--- Giving text to the AI Analyst to find offers... ---")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=10000, chunk_overlap=500)
    chunks = text_splitter.split_text(text_data)
    print(f"--- Broke the text into {len(chunks)} smaller chunks. Analyzing each one... ---")
    all_offers_found = []
    try:
        prompt_text = """
        From the text below, extract all credit card offers into a JSON list.
        Each object in the list MUST have these keys: "bank_name", "card_name", "merchant_name", "offer_details".
        If a value is not found, use the string "Not specified".
        If there are absolutely no offers in the text, you MUST respond with an empty list: [].

        TEXT TO ANALYZE:
        {text}
        """
        prompt_template = ChatPromptTemplate.from_template(prompt_text)
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
        chain = prompt_template | llm
        for i, chunk in enumerate(chunks):
            print(f"--- Analyzing chunk {i+1}/{len(chunks)}... ---")
            try:
                response = chain.invoke({"text": chunk})
                ai_response_text = response.content
                start_index = ai_response_text.find('[')
                end_index = ai_response_text.rfind(']')
                if start_index != -1 and end_index != -1:
                    json_str = ai_response_text[start_index:end_index+1]
                    offers_in_chunk = json.loads(json_str)
                    for offer in offers_in_chunk:
                        offer['source_url'] = source_url
                        offer['disclaimer'] = "This is unverified data scraped from the source URL. Use at your own risk."
                    all_offers_found.extend(offers_in_chunk)
                    print(f"--- Found {len(offers_in_chunk)} potential offers in this chunk. ---")
                else:
                    print(f"!!! AI Analyst Warning: No valid JSON list found in this chunk. Skipping. !!!")
                time.sleep(5) # Be polite to the API
            except Exception as e:
                print(f"!!! ERROR analyzing chunk {i+1}. Reason: {e} !!!")
                continue
        return all_offers_found
    except Exception as e:
        print(f"!!! ERROR: The AI Analyst failed. Reason: {e} !!!")
        return []

# --- Tool #3: The "Reporter" (Our Database Saver) ---
def save_offers_to_db(supabase_client, offers_list):
    clean_offers = [offer for offer in offers_list if offer.get("offer_details") and "not specified" not in offer.get("offer_details").lower()]
    print(f"--- Reporting {len(clean_offers)} new, clean offers to the database... ---")
    try:
        if not clean_offers:
            print("--- No new clean offers to report from this URL. ---")
            return
        data, count = supabase_client.table('offer').insert(clean_offers).execute()
        print(f"*** Success! Saved {len(data[1])} offers to the database. ***")
    except Exception as e:
        print(f"!!! ERROR: Could not save to database. Reason: {e} !!!")

# --- Step 3: The Main Mission ---
def run_mission():
    print("--- INITIALIZING OFFER HUNTER AGENT ---")
    
    # Check if we have our secret keys
    if not all([GEMINI_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
        print("!!! CRITICAL ERROR: Missing one or more secret keys. Aborting mission. !!!")
        return

    # Setting up the connection to our database
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("--- Successfully connected to the Supabase database! ---")

    # Our FULL list of production targets
    target_urls = [
    "https://www.bracbank.com/en/retail/card/extra/dining",
    "https://www.bracbank.com/en/retail/card",
    "https://av.sc.com/bd/edm/b1g1-offers/",
    "https://www.sc.com/bd/promotions/",
    "https://www.sc.com/bd/credit-cards/",
    "https://www.sc.com/bd/credit-cards/visa-smart-platinum/",
    "https://www.sc.com/bd/credit-cards/visa-signature/",
    "https://www.sc.com/bd/credit-cards/super-value-titanium/",
    "https://www.sc.com/bd/credit-cards/silver-visa-mastercard/",
    "https://www.sc.com/bd/credit-cards/assurance-credit-card/",
    "https://www.sc.com/in/credit-cards/offers/",
    "https://www.bracbank.com/en/retail/card/extra/freeoffer",
    "https://www.bracbank.com/en/retail/card/extra/lifestyle",
    "https://www.bracbank.com/en/retail/card/extra/hotel",
    "https://www.ebl.com.bd/retail/EBL-Cards",
    "https://www.ebl.com.bd/retail/eblcard/EBL-Visa-Classic-Credit-Card",
    "https://www.ebl.com.bd/retail/eblcard/EBL-VISA-Gold-Credit-Card",
    "https://www.ebl.com.bd/retail/eblcard/EBL-VISA-Platinum-Credit-Card",
    "https://www.citybankplc.com/card/amex-cards",
    "https://www.citybankplc.com/platinum-reserve-credit-card/",
    "https://www.citybankplc.com/card/amex-platinum",
    "https://www.ucb.com.bd/cards/card-privileges",
    "https://www.americanexpress.com/en-bd/network/credit-cards/city-bank/gold-credit-card.html/",
    "https://www.americanexpress.com/en-bd/network/credit-cards/city-bank/platinum-credit-card.html/",
    "https://www.americanexpress.com/en-bd/network/credit-cards/city-bank/platinum-reserve-credit-card/"
    ]

    # The main loop
    for url in target_urls:
        raw_text = scrape_url(url)
        if raw_text:
            found_offers = find_offers_in_text(raw_text, GEMINI_API_KEY, url)
            save_offers_to_db(supabase, found_offers)
        else:
            print("*** Failed to get text. Moving on. ***")
        print("--------------------------------------------------\n")
        time.sleep(3)

    print("--- FULL AGENT MISSION COMPLETE ---")

# --- This line makes the script start when it's run from the command line ---
if __name__ == "__main__":
    run_mission()










