
'use server';
/**
 * @fileOverview A server-side flow to retrieve global application settings from Firestore.
 *
 * - getAppSettings - Fetches the current application settings.
 * - AppSettings - The type definition for the application settings.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-server';

const AppSettingsSchema = z.object({
  freemiumCode: z.string().length(6, { message: "Code must be 6 digits" }).default("239028"),
  freemiumCodeExpiry: z.number().nullable().default(null).describe("The timestamp when the freemium code expires."),
  monthlyPrice: z.number().min(10).max(100).default(29),
  yearlyPrice: z.number().min(99).max(500).default(199),
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

const getAppSettingsFlow = ai.defineFlow(
  {
    name: 'getAppSettingsFlow',
    inputSchema: z.void(),
    outputSchema: AppSettingsSchema,
  },
  async () => {
    if (!db) {
      console.error("Firestore Admin is not initialized. Returning default settings.");
      console.error("Check Firebase environment variables: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, etc.");
      return AppSettingsSchema.parse({});
    }

    try {
      console.log("Fetching app settings from Firestore...");
      const settingsRef = db.collection('app-settings').doc('main');
      const docSnap = await settingsRef.get();

      if (docSnap.exists) {
        console.log("App settings document found in Firestore");
        // Validate data from Firestore against our Zod schema
        const result = AppSettingsSchema.safeParse(docSnap.data());
        if (result.success) {
          console.log("App settings validation successful:", result.data);
          return result.data;
        }
        // If data is invalid, return default and log error
        console.warn("Firestore 'app-settings' document has invalid data, returning defaults.", result.error);
      } else {
        console.log("App settings document not found, creating with defaults");
      }
      
      // If document doesn't exist or is invalid, create it with default values
      const defaultSettings = AppSettingsSchema.parse({});
      await settingsRef.set(defaultSettings);
      console.log("Created default app settings in Firestore:", defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error("Error fetching app settings from Firestore:", error);
      console.error("Returning default settings due to database error");
      return AppSettingsSchema.parse({});
    }
  }
);

export async function getAppSettings(): Promise<AppSettings> {
    return getAppSettingsFlow();
}
