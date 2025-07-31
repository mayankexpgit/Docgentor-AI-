
'use server';
/**
 * @fileOverview A secure, server-side flow for admins to update global application settings.
 *
 * - updateAppSettings - Updates the settings in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-server';

const AppSettingsUpdateSchema = z.object({
  adminId: z.string().describe("The UID of the user attempting the update."),
  freemiumCode: z.string().length(6, { message: "Code must be 6 digits" }),
  monthlyPrice: z.number().min(10).max(100),
  yearlyPrice: z.number().min(99).max(500),
});

const updateAppSettingsFlow = ai.defineFlow(
  {
    name: 'updateAppSettingsFlow',
    inputSchema: AppSettingsUpdateSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (settings) => {
    if (!db) {
        console.error('Firestore Admin is not initialized. Cannot update settings.');
        console.error("Check Firebase environment variables: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, etc.");
        throw new Error('Firestore Admin is not initialized. Cannot update settings.');
    }
    
    console.log(`Admin user ${settings.adminId} is updating app settings:`, {
        freemiumCode: settings.freemiumCode,
        monthlyPrice: settings.monthlyPrice,
        yearlyPrice: settings.yearlyPrice
    });

    const settingsRef = db.collection('app-settings').doc('main');

    // Calculate the new expiry date: 7 days from now
    const newExpiryTimestamp = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    console.log(`Setting freemium code expiry to: ${new Date(newExpiryTimestamp).toISOString()}`);

    try {
      // We use `set` with `merge: true` to ensure we don't wipe other fields
      // and can update or add the expiry date.
      const updateData = {
        freemiumCode: settings.freemiumCode,
        freemiumCodeExpiry: newExpiryTimestamp,
        monthlyPrice: settings.monthlyPrice,
        yearlyPrice: settings.yearlyPrice,
      };
      
      console.log("Updating Firestore with data:", updateData);
      await settingsRef.set(updateData, { merge: true });

      console.log("App settings updated successfully in Firestore");
      return { success: true, message: 'App settings updated successfully.' };
    } catch (error: any) {
      console.error("Firestore update failed:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to update settings in Firestore: ${error.message}`);
    }
  }
);

export async function updateAppSettings(input: z.infer<typeof AppSettingsUpdateSchema>): Promise<{ success: boolean; message: string }> {
    return updateAppSettingsFlow(input);
}
