// VersionHistoryTab.tsx
import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface VersionInfo {
  version: number
  timestamp: string
  changes: string
}

interface VersionHistoryTabProps {
  ruleId: string
  currentVersion: number
  onRevert: (ruleId: string, targetVersion: number) => Promise<void>
}

export default function VersionHistoryTab({ ruleId, currentVersion, onRevert }: VersionHistoryTabProps) {
  const [versions, setVersions] = useState<VersionInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchVersionHistory = async () => {
      setIsLoading(true)
      try {
        // Replace this with an actual API call
        const response = await fetch(`/api/config/rules/${ruleId}/versions`)
        if (!response.ok) {
          throw new Error('Failed to fetch version history')
        }
        const data = await response.json()
        setVersions(data.versions)
      } catch (error) {
        console.error('Error fetching version history:', error)
        // Handle error (e.g., show a toast notification)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVersionHistory()
  }, [ruleId])

  const handleRevert = async (targetVersion: number) => {
    if (window.confirm(`Are you sure you want to revert to version ${targetVersion}?`)) {
      try {
        await onRevert(ruleId, targetVersion)
      } catch (error) {
        console.error('Error reverting version:', error)
        // Handle error (e.g., show a toast notification)
      }
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Version History</h2>
      {isLoading ? (
        <p>Loading version history...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Changes</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((version) => (
              <TableRow key={version.version}>
                <TableCell>{version.version}</TableCell>
                <TableCell>{new Date(version.timestamp).toLocaleString()}</TableCell>
                <TableCell>{version.changes}</TableCell>
                <TableCell>
                  {version.version !== currentVersion && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevert(version.version)}
                    >
                      Revert
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
