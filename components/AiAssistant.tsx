
  import React, { useState, useMemo } from 'react';
  import { Business, Category } from '../types';
  import { GoogleGenAI, Type } from "@google/genai";
  import { formatPhoneNumber } from '@/utils';

  interface AiResult {
      summary: string;
      results: Array<{
          type: 'business' | 'text';
          businessId?: string;
          content?: string;
      }>;
  }

  const AiBusinessResultCard: React.FC<{ business: Business, onViewBusiness: (business: Business) => void }> = ({ business, onViewBusiness }) => (
      <div className="bg-surface rounded-lg p-4 shadow-subtle border-l-4 border-secondary flex items-center justify-between gap-3">
          <div>
              <h4 className="font-bold text-primary">{business.shopName}</h4>
              <p className="text-sm text-text-secondary">{business.ownerName}</p>
              <p className="text-sm text-text-primary font-semibold mt-1">{formatPhoneNumber(business.contactNumber)}</p>
          </div>
          <button
              onClick={() => onViewBusiness(business)}
              className="bg-primary/10 text-primary font-bold py-2 px-4 rounded-lg hover:bg-primary/20 transition-colors"
          >
              पहा
          </button>
      </div>
  );

  const AiResponseCard: React.FC<{ aiResult: AiResult, businessMap: Map<string, Business>, onViewBusiness: (business: Business) => void }> = ({ aiResult, businessMap, onViewBusiness }) => (
      <div className="mt-6 space-y-4 animate-fadeInUp">
          <div className="p-4 bg-primary/10 rounded-lg">
              <p className="font-semibold text-text-primary">{aiResult.summary}</p>
          </div>
          <div className="space-y-3">
              {aiResult.results.map((result, index) => {
                  if (result.type === 'business' && result.businessId) {
                      const business = businessMap.get(result.businessId);
                      return business ? <AiBusinessResultCard key={business.id} business={business} onViewBusiness={onViewBusiness} /> : null;
                  }
                  if (result.type === 'text' && result.content) {
                      return <p key={index} className="p-3 bg-surface rounded-lg text-text-secondary shadow-subtle">{result.content}</p>
                  }
                  return null;
              })}
          </div>
      </div>
  );

  interface AiAssistantProps {
      businesses: Business[];
      categories: Category[];
      onViewBusiness: (business: Business) => void;
      query: string;
      onQueryChange: (query: string) => void;
  }

  const AiAssistant: React.FC<AiAssistantProps> = ({ businesses, categories, onViewBusiness, query, onQueryChange }) => {
      const [response, setResponse] = useState<AiResult | null>(null);
      const [isLoading, setIsLoading] = useState(false);
      const [error, setError] = useState('');
      const businessMap = useMemo(() => new Map(businesses.map(b => [b.id, b])), [businesses]);

      const handleQuery = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!query.trim()) return;

          setIsLoading(true);
          setError('');
          setResponse(null);

          const businessContext = businesses.map(b => ({
              id: b.id,
              shopName: b.shopName,
              ownerName: b.ownerName,
              category: categories.find(c => c.id === b.category)?.name || 'Unknown',
              services: b.services,
              contact: b.contactNumber,
          }));

          const prompt = `You are a very helpful assistant for the "Jawala Business Directory".
          Your goal is to understand a user's request in Marathi and provide the most relevant information from the business list.

          Here is the list of all available businesses:
          ${JSON.stringify(businessContext, null, 2)}

          User's Request: "${query}"

          Analyze the request and respond with a JSON object. The JSON must contain:
          1.  "summary": A short, conversational summary of your findings in Marathi.
          2.  "results": An array of results. Each result can be one of two types:
              -   type: "business": If you find a relevant business, include its "businessId".
              -   type: "text": If the user asks for specific information (like a phone number) or if no business is a good match, provide a helpful answer in the "content" field.

          If you find multiple relevant businesses, list them all. If the request is generic or you cannot find a good match, provide a friendly text response.`;
          
          try {
              const apiKey = process.env.API_KEY;
              if (!apiKey) {
                  throw new Error("API key is not configured. Please set the API_KEY environment variable.");
              }
              const ai = new GoogleGenAI({ apiKey });
              const result = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: prompt,
                  config: {
                      responseMimeType: "application/json",
                      responseSchema: {
                          type: Type.OBJECT,
                          properties: {
                              summary: { type: Type.STRING },
                              results: {
                                  type: Type.ARRAY,
                                  items: {
                                      type: Type.OBJECT,
                                      properties: {
                                          type: { type: Type.STRING },
                                          businessId: { type: Type.STRING },
                                          content: { type: Type.STRING },
                                      }
                                  }
                              }
                          }
                      }
                  }
              });
              const jsonStr = result.text.trim();
              const parsedResponse = JSON.parse(jsonStr) as AiResult;
              setResponse(parsedResponse);

          } catch (err) {
              console.error("AI Chat Error:", err);
              const errorMessage = 'उत्तर मिळवताना एक समस्या आली. कृपया पुन्हा प्रयत्न करा.';
              // FIX: Removed specific API key error messages shown to the user to comply with guidelines.
              setError(errorMessage);
          } finally {
              setIsLoading(false);
          }
      };
      
      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          onQueryChange(e.target.value);
          if (response) setResponse(null);
          if (error) setError('');
      };

      return (
          <div className="bg-surface p-6 rounded-2xl shadow-card mb-8 animate-fadeInUp" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center gap-3 mb-3">
                  <i className="fa-solid fa-wand-magic-sparkles text-2xl text-primary"></i>
                  <h2 className="font-inter text-2xl font-bold text-primary">शोध आणि AI मदतनीस</h2>
              </div>
              <p className="text-text-secondary mb-4">व्यवसाय, मालक किंवा संपर्क शोधा. थेट सापडले नाही, तर आमचा AI मदतनीस मदत करेल!</p>
              
              <form onSubmit={handleQuery} className="flex flex-col sm:flex-row gap-3">
                  <input
                      type="text"
                      value={query}
                      onChange={handleInputChange}
                      placeholder="उदा. किराणा दुकान, राहुल पद्मावार, किंवा 'शेवया कुठे मिळतात?'"
                      className="flex-grow w-full px-5 py-3 border-2 border-border-color rounded-full bg-background focus:outline-none focus:border-primary"
                      disabled={isLoading}
                  />
                  <button type="submit" disabled={isLoading || !query.trim()} className="px-8 py-3 bg-primary text-white font-semibold rounded-full hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:bg-primary disabled:opacity-60 disabled:cursor-not-allowed">
                      {isLoading ? <><i className="fas fa-spinner fa-spin"></i> शोधत आहे...</> : <><i className="fa-solid fa-wand-magic-sparkles"></i> AI शोध</>}
                  </button>
              </form>
              
              {isLoading && !response && (
                  <div className="flex items-center justify-center p-6">
                      <div className="w-8 h-8 border-4 border-t-primary border-gray-200 rounded-full animate-spin"></div>
                      <p className="ml-4 text-text-secondary animate-pulse">तुमच्यासाठी माहिती शोधत आहे...</p>
                  </div>
              )}
              {error && <p className="text-center text-red-600 font-semibold p-4 mt-4 bg-red-50 border border-red-200 rounded-lg">{error}</p>}
              {response && <AiResponseCard aiResult={response} businessMap={businessMap} onViewBusiness={onViewBusiness} />}
          </div>
      );
  };

  export default AiAssistant;
