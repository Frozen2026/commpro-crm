/**
 * Onboarding helpers for new MakerKit team accounts
 * Handles creating default CommPro.ai resources (agencies, agent profiles)
 */

import { createClient } from '@/lib/supabase/server';

interface OnboardingData {
  accountId: string;
  userId: string;
  companyName: string;
}

/**
 * Create default CommPro.ai resources for a new team account
 * Called after a new MakerKit team account is created
 *
 * This:
 * 1. Creates a default agencies row: "[Company Name] Agency"
 * 2. Creates an agent_profiles row for the current user
 * 3. Links the user's agent_profiles to the new agency
 */
export async function setupCommProOnboarding(
  data: OnboardingData
): Promise<{
  success: boolean;
  agencyId?: string;
  error?: string;
}> {
  const supabase = createClient();

  try {
    // 1. Create default agency
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .insert({
        account_id: data.accountId,
        name: `${data.companyName} Agency`,
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (agencyError) {
      console.error('Failed to create default agency:', agencyError);
      return {
        success: false,
        error: `Failed to create agency: ${agencyError.message}`,
      };
    }

    if (!agency) {
      return {
        success: false,
        error: 'Agency creation returned no data',
      };
    }

    // 2. Create or update agent_profiles for the current user
    const { error: profileError } = await supabase
      .from('agent_profiles')
      .upsert(
        {
          id: data.userId,
          account_id: data.accountId,
          agency_id: agency.id,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
        }
      )
      .select()
      .single();

    if (profileError) {
      console.error('Failed to create agent profile:', profileError);
      return {
        success: false,
        error: `Failed to create profile: ${profileError.message}`,
      };
    }

    return {
      success: true,
      agencyId: agency.id,
    };
  } catch (error) {
    console.error('Onboarding error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify CommPro.ai onboarding is complete for a team account
 * Returns the default agency if setup, null if not yet done
 */
export async function verifyCommProOnboarding(
  accountId: string
): Promise<{
  isComplete: boolean;
  defaultAgencyId?: string;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const { data: agencies, error } = await supabase
      .from('agencies')
      .select('id, name')
      .eq('account_id', accountId)
      .limit(1);

    if (error) {
      return {
        isComplete: false,
        error: `Failed to verify onboarding: ${error.message}`,
      };
    }

    if (!agencies || agencies.length === 0) {
      return {
        isComplete: false,
      };
    }

    return {
      isComplete: true,
      defaultAgencyId: agencies[0].id,
    };
  } catch (error) {
    return {
      isComplete: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
