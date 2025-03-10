// VersionHistoryTab.tsx
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface VersionInfo {
  version: string // Changed from number to string to match backend versionId
  displayVersion: number // Numeric version for display (count-based)
  timestamp: string
  changes: string
}

interface VersionHistoryTabProps {
  ruleId: string
  currentVersion: string
  onRevert: (ruleId: string, targetVersion: string) => Promise<void>
}

export default function VersionHistoryTab({ ruleId, currentVersion, onRevert }: VersionHistoryTabProps) {
  const [versions, setVersions] = useState<VersionInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchVersionHistory = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/config/rules/${ruleId}/versions`)
        if (!response.ok) {
          throw new Error('Failed to fetch version history')
        }
        const data = await response.json()
        
        // Transform backend versions data to match UI component's expected format
        const transformedVersions = Array.isArray(data.versions) 
          ? data.versions.map((version: any, index: number) => ({
              version: version.versionId, // Use versionId as version identifier
              displayVersion: data.versions.length - index, // Calculate display version from total count
              timestamp: version.timestamp,
              changes: Array.isArray(version.changes) 
                ? version.changes.join(', ') 
                : (version.changes || 'Updated rule')
            }))
          : []
        
        setVersions(transformedVersions)
      } catch (error) {
        console.error('Error fetching version history:', error)
        // Handle error (e.g., show a toast notification)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVersionHistory()
  }, [ruleId])

  const handleRevert = async (targetVersion: string) => {
    if (window.confirm(`Are you sure you want to revert to this version?`)) {
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
            {versions.map((version, index) => (
              <TableRow key={version.version}>
                <TableCell>{version.displayVersion}</TableCell>
                <TableCell>{new Date(version.timestamp).toLocaleString()}</TableCell>
                <TableCell>{version.changes}</TableCell>
                <TableCell>
                  {String(version.version) !== String(currentVersion) && (
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
