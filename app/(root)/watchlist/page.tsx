import { getUserWatchlist } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getUserAlerts } from "@/lib/actions/alert.actions";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import WatchlistTable from "@/components/WatchlistTable";
import AlertsList from "@/components/AlertsList";
import { formatTimeAgo } from "@/lib/utils";
import { SearchCommand } from "@/components/SearchCommand";

export default async function WatchlistPage() {
  try {
    const authInstance = await auth;
    const session = await authInstance.api.getSession({
      headers: await headers(),
    });

    const watchlist = await getUserWatchlist();
    const alerts = await getUserAlerts();

    // Get news based on watchlist symbols
    let news: MarketNewsArticle[] = [];
    try {
      if (session?.user?.email) {
        const symbols = await getWatchlistSymbolsByEmail(session.user.email);
        news = await getNews(symbols.length > 0 ? symbols : undefined);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
    }

    return (
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="watchlist-title">My Watchlist</h1>
            <p className="text-gray-500 mt-1">
              Track your favorite stocks and stay updated
            </p>
          </div>
        </div>

        {/* Watchlist & Alerts Container */}
        <div className="watchlist-container">
          {/* Watchlist Table */}
          <div className="watchlist">
            <WatchlistTable watchlist={watchlist} />
          </div>

          {/* Alerts Section */}
          <AlertsList alertData={alerts} />
        </div>

        {/* News Section */}
        {news.length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-100">
                Latest News
              </h2>
              <p className="text-gray-500 mt-1">
                News from your watchlist stocks
              </p>
            </div>

            <div className="watchlist-news">
              {news.map((article) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-item"
                >
                  {article.related && (
                    <span className="news-tag">{article.related}</span>
                  )}
                  <h3 className="news-title">{article.headline}</h3>
                  <div className="news-meta">
                    <span>{article.source}</span>
                    <span className="mx-2">•</span>
                    <span>{formatTimeAgo(article.datetime)}</span>
                  </div>
                  <p className="news-summary">{article.summary}</p>
                  <span className="news-cta">Read more →</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Watchlist page error:", error);
    return (
      <div className="space-y-8">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            Unable to load watchlist
          </h2>
          <p className="text-gray-500">Please try again later</p>
        </div>
      </div>
    );
  }
}
