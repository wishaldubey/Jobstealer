import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useState } from 'react';

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer;
}

export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);  // Track loading state

  async function main() {
    try {
      // Set up the event listener to handle the server-ready event
      webContainer.on('server-ready', (port, url) => {
        console.log(`Server ready on port ${port} at ${url}`);
        setUrl(url);
        setLoading(false);  // Set loading to false when the server is ready
      });

      // Install dependencies
      const installProcess = await webContainer.spawn('npm', ['install']);
      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          console.log('Install process output:', data);
        }
      }));

      // Start the dev server
      await webContainer.spawn('npm', ['run', 'dev']);

      // Wait for `server-ready` event
      console.log('Waiting for server to be ready...');
    } catch (error) {
      console.error('Error during setup:', error);
      setLoading(false);  // Set loading to false in case of error
    }
  }

  useEffect(() => {
    main();
  }, []);

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {loading ? (
        <div className="text-center">
          <p className="mb-2">Loading...</p>
        </div>
      ) : (
        <iframe
          width="100%"
          height="100%"
          src={url}
          title="Preview"
          style={{ border: 'none' }} // Ensure no border around the iframe
        />
      )}
    </div>
  );
}
