import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/utils/crypto';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { GRAPH_BASE, graphFetch } from '@/lib/meta/pageDiscovery';

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Look for an existing pending Instagram connection to extract the user token
  const conn = await prisma.instagramConnection.findUnique({ where: { tenantId: auth.tenantId } });
  
  if (!conn || !conn.accessToken) {
    return NextResponse.json({
      error: 'no_token',
      message: 'Nenhum token da Meta encontrado. Tente clicar em "Autorizar com Meta" e cancelar ou prosseguir antes de rodar o diagnóstico.'
    }, { status: 400 });
  }

  const userToken = decrypt(conn.accessToken);

  console.log(`[IG_DEBUG] Starting diagnostic pass for tenant=${auth.tenantId}`);

  // Check A: List accounts with user token
  const accountsResult = await graphFetch(
    `${GRAPH_BASE}/me/accounts?fields=id,name,tasks,access_token,instagram_business_account,connected_instagram_account&access_token=${userToken}`
  );

  const rawPages = accountsResult.data?.data || [];
  
  const diagnosticReport = {
    selectedTenantId: auth.tenantId,
    pagesFound: rawPages.length,
    accountsListApiOk: accountsResult.ok,
    accountsListApiError: accountsResult.graphError,
    pages: [] as any[]
  };

  for (const page of rawPages) {
    const pageId = page.id;
    const pageName = page.name;
    const tasks = page.tasks || [];
    const pageToken = page.access_token;
    
    const pageResult = {
      pageId,
      pageName,
      tasks,
      hasPageToken: !!pageToken,
      userTokenProbe: {
        apiOk: false,
        instagram_business_account_present: false,
        connected_instagram_account_present: false,
        errorCode: null as number | null,
        errorMessage: null as string | null
      },
      pageTokenProbe: {
        apiOk: false,
        instagram_business_account_present: false,
        connected_instagram_account_present: false,
        errorCode: null as number | null,
        errorMessage: null as string | null
      }
    };

    // Probe B: Detailed fetch with USER token
    const userProbeResult = await graphFetch(
      `${GRAPH_BASE}/${pageId}?fields=id,name,tasks,access_token,instagram_business_account,connected_instagram_account&access_token=${userToken}`
    );
    
    pageResult.userTokenProbe.apiOk = userProbeResult.ok;
    
    if (userProbeResult.ok) {
      pageResult.userTokenProbe.instagram_business_account_present = !!userProbeResult.data?.instagram_business_account;
      pageResult.userTokenProbe.connected_instagram_account_present = !!userProbeResult.data?.connected_instagram_account;
    } else {
      pageResult.userTokenProbe.errorCode = userProbeResult.graphError?.code || null;
      pageResult.userTokenProbe.errorMessage = userProbeResult.graphError?.message || null;
    }

    // Probe C: Detailed fetch with PAGE token
    if (pageToken) {
      const pageProbeResult = await graphFetch(
        `${GRAPH_BASE}/${pageId}?fields=id,name,tasks,instagram_business_account,connected_instagram_account&access_token=${pageToken}`
      );
      
      pageResult.pageTokenProbe.apiOk = pageProbeResult.ok;
      
      if (pageProbeResult.ok) {
        pageResult.pageTokenProbe.instagram_business_account_present = !!pageProbeResult.data?.instagram_business_account;
        pageResult.pageTokenProbe.connected_instagram_account_present = !!pageProbeResult.data?.connected_instagram_account;
      } else {
        pageResult.pageTokenProbe.errorCode = pageProbeResult.graphError?.code || null;
        pageResult.pageTokenProbe.errorMessage = pageProbeResult.graphError?.message || null;
      }
    }

    diagnosticReport.pages.push(pageResult);
    
    console.log(`[IG_DEBUG] Evaluated page ${pageId} (${pageName}). Has IG (UserToken): ${pageResult.userTokenProbe.instagram_business_account_present}; Has Connected IG (UserToken): ${pageResult.userTokenProbe.connected_instagram_account_present}`);
  }

  console.log(`[IG_DEBUG] Finished diagnostic pass for tenant=${auth.tenantId}`);

  return NextResponse.json(diagnosticReport);
}
