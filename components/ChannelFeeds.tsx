import { getChannelVideos } from "@/lib/youtube";

// We pass the channelId and name from the JSON
export default async function ChannelFeeds({ channelId, name }: { channelId: string, name: string }) {
  const { liveStreams, recordedVideos } = await getChannelVideos(channelId);

  return (
    <div className="mb-12 border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
      <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">{name}</h3>

      {/* LIVE SECTION */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
          <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
          Live Now
        </h4>
        {liveStreams.length === 0 ? (
          <p className="text-gray-500 text-sm">No active live streams.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveStreams.map((video) => (
              <div key={video.id} className="rounded-lg overflow-hidden border">
                <iframe
                  className="w-full aspect-video"
                  src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1`}
                  title={video.title}
                  allowFullScreen
                ></iframe>
                <p className="p-3 font-medium text-sm truncate">{video.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECORDED SECTION */}
      <div>
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
          📼 Recent Recordings
        </h4>
        {recordedVideos.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent videos.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recordedVideos.map((video) => (
              <div key={video.id} className="rounded-lg overflow-hidden border">
                <iframe
                  className="w-full aspect-video"
                  src={`https://www.youtube.com/embed/${video.id}`}
                  title={video.title}
                  allowFullScreen
                ></iframe>
                <p className="p-3 font-medium text-sm line-clamp-2">{video.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}