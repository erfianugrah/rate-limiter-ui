import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Version {
  version: number;
  timestamp: string;
  changes: string[];
  data: any;
}

interface VersionHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ruleId: string;
  currentVersion: number;
  onRevert: (ruleId: string, targetVersion: number) => Promise<void>;
}

export function VersionHistoryDialog({
  isOpen,
  onClose,
  ruleId,
  currentVersion,
  onRevert,
}: VersionHistoryDialogProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      fetch(`/api/config/rules/${ruleId}/versions`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          setVersions(data.versions);
          setIsLoading(false);
        })
        .catch((e) => {
          setError(`Failed to fetch version history: ${e instanceof Error ? e.message : 'Unknown error'}`);
          setIsLoading(false);
        });
    }
  }, [isOpen, ruleId]);

  const handleRevert = async (targetVersion: number) => {
    try {
      await onRevert(ruleId, targetVersion);
      onClose();
    } catch (e) {
      setError(`Failed to revert: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>View and revert to previous versions</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p>Loading version history...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <ul className="space-y-4">
            {versions.map((version) => (
              <li key={version.version} className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">Version {version.version}</p>
                  <p className="text-sm text-gray-500">{new Date(version.timestamp).toLocaleString()}</p>
                  <ul className="list-disc list-inside">
                    {version.changes.map((change, index) => (
                      <li key={index} className="text-sm">{change}</li>
                    ))}
                  </ul>
                </div>
                {version.version !== currentVersion && (
                  <Button onClick={() => handleRevert(version.version)}>Revert</Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
