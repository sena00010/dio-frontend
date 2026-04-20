import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type AdPlatformType = "all" | "meta" | "google" | "tiktok" | "linkedin";

export function useMarketingData() {
  const { activeCompany } = useAuth();

  const getInitialPlatform = (): AdPlatformType => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("gads_connected") === "true") return "google";
      if (params.get("meta_connected") === "true") return "meta";
      if (params.get("tiktok_connected") === "true") return "tiktok";
      if (params.get("linkedin_connected") === "true") return "linkedin";
    }
    return "all";
  };
  const [adPlatform, setAdPlatform] = useState<AdPlatformType>(getInitialPlatform);

  // ── Meta state ──
  const [isMetaConnected, setIsMetaConnected] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaInsights, setMetaInsights] = useState<{
    spend: number; revenue: number; roas: number; conversions: number;
  } | null>(null);
  const [metaCampaigns, setMetaCampaigns] = useState<Array<{
    id: string; name: string; status: string; daily_budget: number; spend: number; roas: number;
  }>>([]);
  const [metaAdAccounts, setMetaAdAccounts] = useState<Array<{
    account_id: string; name: string; status: string; currency: string; amount_spent: number;
  }>>([]);
  const [selectedMetaAccount, setSelectedMetaAccount] = useState<string>("");

  // ── Google Ads state ──
  const [isGadsConnected, setIsGadsConnected] = useState(false);
  const [gadsLoading, setGadsLoading] = useState(true);
  const [gadsError, setGadsError] = useState<string | null>(null);
  const [gadsInsights, setGadsInsights] = useState<{
    spend: number; clicks: number; impressions: number; conversions: number; cpc: number; ctr: number;
  } | null>(null);
  const [gadsCampaigns, setGadsCampaigns] = useState<Array<{
    id: string; name: string; status: string; spend: number; clicks: number; impressions: number; conversions: number;
  }>>([]);

  // ── TikTok state ──
  const [isTikTokConnected, setIsTikTokConnected] = useState(false);
  const [tiktokLoading, setTiktokLoading] = useState(false);
  const [tiktokError, setTiktokError] = useState<string | null>(null);
  const [tiktokInsights, setTiktokInsights] = useState<{
    spend: number; clicks: number; conversions: number; cpa: number; conversion_rate: number;
  } | null>(null);
  const [tiktokDebug, setTiktokDebug] = useState<any>(null);

  // ── LinkedIn state ──
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(true);
  const [linkedinInsights, setLinkedinInsights] = useState<{
    spend: number; clicks: number; impressions: number; conversions: number;
  } | null>(null);
  const [linkedinCampaigns, setLinkedinCampaigns] = useState<any[]>([]);
  const [linkedinSocialData, setLinkedinSocialData] = useState<{
    followers: number; total_views: number; desktop_views: number; mobile_views: number;
    overview_views: number; about_views: number; engagement: number; posts: number; org_name: string;
  } | null>(null);
  const [linkedinAdAccounts, setLinkedinAdAccounts] = useState<Array<{
    id: number; urn: string; name: string; status: string; currency: string; serving: string;
  }>>([]);
  const [selectedLinkedinAccount, setSelectedLinkedinAccount] = useState<string>("");
  const [linkedinDebug, setLinkedinDebug] = useState<any>(null);
  
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<string>("30");
  const [customDates, setCustomDates] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  // ── Omnichannel Stats (birleşik toplam) ──
  const [omniStats, setOmniStats] = useState<{
    platforms: Array<{ platform: string; spend: number; clicks: number; conversions: number; roas: number }>;
    totals: { spend: number; clicks: number; conversions: number; roas: number };
  } | null>(null);
  const [omniLoading, setOmniLoading] = useState(true);

  const getQueryParams = () => {
    if (datePreset === "custom" && customDates.start && customDates.end) {
      return `&since=${customDates.start}&until=${customDates.end}`;
    }
    return `&days=${datePreset}`;
  };

  // ── Meta veri çekme ──
  const fetchMetaDashboard = (companyId: number) => {
    api.get(`/api/meta/dashboard?company_id=${companyId}${getQueryParams()}`)
      .then((res) => {
        if (res?.data) {
          if (res.data.insights) setMetaInsights(res.data.insights);
          if (res.data.campaigns) setMetaCampaigns(res.data.campaigns);
        }
        setMetaLoading(false);
      })
      .catch(() => setMetaLoading(false));
  };

  useEffect(() => {
    if (!activeCompany) return;
    setMetaLoading(true);
    api.get(`/api/meta/status?company_id=${activeCompany.id}`)
      .then(({ data }) => {
        if (data.connected) {
          setIsMetaConnected(true);
          if (data.ad_account_id) setSelectedMetaAccount(data.ad_account_id);
          fetchMetaDashboard(activeCompany.id);
          api.get(`/api/meta/ad-accounts?company_id=${activeCompany.id}`)
            .then(({ data: accData }) => {
              if (accData.ad_accounts) setMetaAdAccounts(accData.ad_accounts);
              if (accData.selected_id) setSelectedMetaAccount(accData.selected_id);
            }).catch(() => {});
        } else { setIsMetaConnected(false); setMetaLoading(false); }
      })
      .catch(() => { setIsMetaConnected(false); setMetaLoading(false); });
  }, [activeCompany]);

  const handleMetaAccountChange = (accountId: string) => {
    if (!activeCompany || accountId === selectedMetaAccount) return;
    const acc = metaAdAccounts.find(a => a.account_id === accountId);
    setSelectedMetaAccount(accountId);
    setMetaLoading(true);
    api.put(`/api/meta/select-account?company_id=${activeCompany.id}`, {
      ad_account_id: accountId,
      account_name: acc?.name || "",
    }).then(() => {
      fetchMetaDashboard(activeCompany.id);
    }).catch(() => setMetaLoading(false));
  };

  // ── Google Ads veri çekme ──
  useEffect(() => {
    if (!activeCompany) return;
    setGadsLoading(true);
    setGadsError(null);
    api.get(`/api/google-ads/status?company_id=${activeCompany.id}`)
      .then(({ data }) => {
        if (data.connected) {
          setIsGadsConnected(true);
          return api.get(`/api/google-ads/dashboard?company_id=${activeCompany.id}`);
        } else { setIsGadsConnected(false); setGadsLoading(false); return null; }
      })
      .then((res) => {
        if (res && res.data) {
          if (res.data.insights) setGadsInsights(res.data.insights);
          if (res.data.campaigns) setGadsCampaigns(res.data.campaigns);
          const errMsg = res.data.insights_error || res.data.campaigns_error || res.data.error;
          if (errMsg && !res.data.insights) {
            if (errMsg.includes("DEVELOPER_TOKEN_NOT_APPROVED")) {
              setGadsError("Developer token henüz onaylanmadı. Google Ads API erişimi için Basic/Standard başvuru yapılmalı.");
            } else {
              setGadsError(errMsg);
            }
          }
        }
        setGadsLoading(false);
      })
      .catch(() => { setIsGadsConnected(false); setGadsLoading(false); });
  }, [activeCompany]);

  // ── TikTok veri çekme ──
  useEffect(() => {
    if (!activeCompany) return;
    setTiktokLoading(true);
    setTiktokError(null);
    api.get(`/api/tiktok/status?company_id=${activeCompany.id}`)
      .then(({ data }) => {
        if (data.connected) {
          setIsTikTokConnected(true);
          // Ayrıyeten debug bilgisini de çek
          api.get(`/api/tiktok/debug?company_id=${activeCompany.id}`).then((res) => {
             setTiktokDebug(res.data);
          }).catch(() => {});
          
          return api.get(`/api/tiktok/dashboard?company_id=${activeCompany.id}`);
        } else { setIsTikTokConnected(false); setTiktokLoading(false); return null; }
      })
      .then((res) => {
        if (res && res.data) {
          if (res.data.insights) {
            setTiktokInsights(res.data.insights);
          } else if (res.data.error) {
            setTiktokError(res.data.error);
          }
        }
        setTiktokLoading(false);
      })
      .catch(() => { setIsTikTokConnected(false); setTiktokLoading(false); });
  }, [activeCompany]);

  // ── LinkedIn veri çekme ──
  const fetchLinkedInDashboard = (companyId: number) => {
    api.get(`/api/linkedin/dashboard?company_id=${companyId}${getQueryParams()}`).then((res) => {
      if (res?.data?.insights) setLinkedinInsights(res.data.insights);
      if (res?.data?.campaigns) setLinkedinCampaigns(res.data.campaigns);
      setLinkedinLoading(false);
    }).catch(() => setLinkedinLoading(false));
  };

  useEffect(() => {
    if (!activeCompany) return;
    setLinkedinLoading(true);
    api.get(`/api/linkedin/status?company_id=${activeCompany.id}`)
      .then(({ data }) => {
        if (data.connected) {
          setIsLinkedInConnected(true);
          if (data.account_urn) setSelectedLinkedinAccount(data.account_urn);
          fetchLinkedInDashboard(activeCompany.id);
          api.get(`/api/linkedin/social?company_id=${activeCompany.id}`).then(({ data: s }) => {
            if (s) setLinkedinSocialData(s);
          }).catch(() => {});
          api.get(`/api/linkedin/ad-accounts?company_id=${activeCompany.id}`).then(({ data: a }) => {
            if (a?.ad_accounts) setLinkedinAdAccounts(a.ad_accounts);
            if (a?.selected_urn) setSelectedLinkedinAccount(a.selected_urn);
          }).catch(() => {});
          api.get(`/api/linkedin/debug?company_id=${activeCompany.id}`).then(({ data: d }) => {
            if (d) setLinkedinDebug(d);
          }).catch(() => {});
        } else { setIsLinkedInConnected(false); setLinkedinLoading(false); }
      })
      .catch(() => { setIsLinkedInConnected(false); setLinkedinLoading(false); });
  }, [activeCompany]);

  useEffect(() => {
    if (!activeCompany) return;
    if (datePreset === "custom" && (!customDates.start || !customDates.end)) {
      return; 
    }
    if (isMetaConnected) fetchMetaDashboard(activeCompany.id);
    if (isLinkedInConnected) fetchLinkedInDashboard(activeCompany.id);
  }, [datePreset, customDates]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setDatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLinkedinAccountChange = (urn: string) => {
    if (!activeCompany || urn === selectedLinkedinAccount) return;
    const acc = linkedinAdAccounts.find(a => a.urn === urn);
    setSelectedLinkedinAccount(urn);
    setLinkedinLoading(true);
    api.put(`/api/linkedin/select-account?company_id=${activeCompany.id}`, {
      account_urn: urn,
      account_name: acc?.name || "",
    }).then(() => {
      fetchLinkedInDashboard(activeCompany.id);
    }).catch(() => setLinkedinLoading(false));
  };

  // ── Omnichannel birleşik stats ──
  useEffect(() => {
    if (!activeCompany) return;
    setOmniLoading(true);
    api.get(`/api/dashboard/stats?company_id=${activeCompany.id}&platform=all`)
      .then(({ data }) => {
        setOmniStats(data);
        setOmniLoading(false);
      })
      .catch(() => { setOmniLoading(false); });
  }, [activeCompany]);

  return {
    adPlatform, setAdPlatform,
    isMetaConnected, setIsMetaConnected, metaLoading, setMetaLoading, metaInsights, setMetaInsights, metaCampaigns, setMetaCampaigns, metaAdAccounts, selectedMetaAccount,
    isGadsConnected, setIsGadsConnected, gadsLoading, setGadsLoading, gadsError, gadsInsights, setGadsInsights, gadsCampaigns, setGadsCampaigns,
    isTikTokConnected, setIsTikTokConnected, tiktokLoading, setTiktokLoading, tiktokError, tiktokInsights, setTiktokInsights, tiktokDebug,
    isLinkedInConnected, setIsLinkedInConnected, linkedinLoading, setLinkedinLoading, linkedinInsights, setLinkedinInsights, linkedinCampaigns, setLinkedinCampaigns, linkedinSocialData,
    linkedinAdAccounts, selectedLinkedinAccount, linkedinDebug,
    campaignFilter, setCampaignFilter,
    datePreset, setDatePreset,
    customDates, setCustomDates,
    datePickerOpen, setDatePickerOpen,
    datePickerRef,
    omniStats, omniLoading,
    handleMetaAccountChange, handleLinkedinAccountChange
  };
}
