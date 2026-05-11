import { Download, Upload } from 'lucide-react'

export default function BackupSection({
    t,
    importMode,
    setImportMode,
    importing,
    onLoadExportData,
    onDownloadExportFile,
    onImport,
    onImportFileChange,
    importText,
    setImportText,
    exportData,
}) {
    return (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold">{t('settings.backupTitle')}</h3>
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={onLoadExportData}
                    className="px-3 py-2 rounded-lg bg-secondary border border-border hover:bg-secondary/80 text-sm flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    {t('settings.loadExport')}
                </button>
                <button
                    type="button"
                    onClick={onDownloadExportFile}
                    className="px-3 py-2 rounded-lg bg-secondary border border-border hover:bg-secondary/80 text-sm flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    {t('settings.downloadExport')}
                </button>
                <label className="px-3 py-2 rounded-lg bg-secondary border border-border hover:bg-secondary/80 text-sm flex items-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {t('settings.chooseImportFile')}
                    <input
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={(e) => {
                            onImportFileChange(e.target.files?.[0] || null)
                            e.target.value = ''
                        }}
                    />
                </label>
                <select
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
                >
                    <option value="merge">{t('settings.importModeMerge')}</option>
                    <option value="replace">{t('settings.importModeReplace')}</option>
                </select>
                <button
                    type="button"
                    onClick={onImport}
                    disabled={importing}
                    className="px-3 py-2 rounded-lg bg-secondary border border-border hover:bg-secondary/80 text-sm flex items-center gap-2"
                >
                    <Upload className="w-4 h-4" />
                    {importing ? t('settings.importing') : t('settings.importNow')}
                </button>
            </div>
            <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={8}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 font-mono text-xs"
                placeholder={t('settings.importPlaceholder')}
            />
            {exportData && (
                <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">{t('settings.exportJson')}</label>
                    <textarea
                        value={exportData.json || ''}
                        readOnly
                        rows={6}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 font-mono text-xs"
                    />
                </div>
            )}
        </div>
    )
}
