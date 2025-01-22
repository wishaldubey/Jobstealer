import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useState } from 'react';

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer;
}

export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState("");

  async function main() {
    try {
      // Set up the event listener first
      webContainer.on('server-ready', (port, url) => {
        console.log(`Server ready on port ${port} at ${url}`);
        setUrl(url);
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

      // Check if the server is ready
      console.log('Waiting for server to be ready...');
    } catch (error) {
      console.error('Error during setup:', error);
    }
  }

  useEffect(() => {
    main();
  }, []);

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {!url ? (
        <div className="text-center">
          <p className="mb-2">Loading...</p>
        </div>
      ) : (
        <iframe width="100%" height="100%" src={url} title="Preview" />
      )}
    </div>
  );
}
