import {
    ChevronDown,
    MessageSquare,
    Cpu,
    Search as SearchIcon,
    Terminal,
    Zap,
    ToggleLeft,
    ToggleRight
} from 'lucide-react'
import clsx from 'clsx'

import { maskSecret } from '../../utils/maskSecret'

export default function ConfigPanel({
    t,
    configExpanded,
    setConfigExpanded,
    models,
    model,
    setModel,
    modelsLoaded,
    streamingMode,
    setStreamingMode,
    selectedAccount,
    setSelectedAccount,
    accounts,
    resolveAccountIdentifier,
    apiKey,
    setApiKey,
    config,
    customKeyActive,
    customKeyManaged,
}) {
    const iconMap = {
        MessageSquare,
        Cpu,
        SearchIcon,
        Terminal,
        Zap,
        ToggleLeft,
        ToggleRight,
    }
    const selectedModel = models.find(m => m.id === model) || models[0]
    const SelectedModelIcon = selectedModel ? (iconMap[selectedModel.icon] || MessageSquare) : MessageSquare
    const defaultKeyPreview = maskSecret(config.keys?.[0])
    const hasModels = models.length > 0

    return (
        <div className={clsx(
            "lg:col-span-3 flex flex-col transition-all duration-300 ease-in-out z-20 min-h-0",
            configExpanded ? "h-auto" : "h-14 lg:h-full"
        )}>
            <div className="bg-card border border-border rounded-xl flex flex-col h-full shadow-sm min-h-0 overflow-hidden">
                <button
                    onClick={() => setConfigExpanded(!configExpanded)}
                    className="lg:hidden flex items-center justify-between p-4 w-full bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                    <div className="flex items-center gap-2.5 font-medium text-sm text-foreground">
                        <div className="p-1.5 rounded-md bg-transparent text-foreground">
                            <Terminal className="w-4 h-4" />
                        </div>
                        <span>{t('apiTester.config')}</span>
                    </div>
                    <div className={clsx("transition-transform duration-300 text-muted-foreground", configExpanded ? "rotate-180" : "") }>
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </button>

                <div className={clsx(
                    "p-4 flex flex-col gap-5",
                    !configExpanded && "hidden lg:flex"
                )}>
                    <div className="space-y-2 shrink-0">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-0.5">{t('apiTester.modelLabel')}</label>
                        <div className="relative">
                            <select
                                className="w-full h-11 pl-3 pr-9 bg-secondary border border-border rounded-lg text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all cursor-pointer hover:bg-muted/70 text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
                                value={model}
                                onChange={e => setModel(e.target.value)}
                                disabled={!hasModels}
                            >
                                {hasModels ? models.map(m => (
                                    <option key={m.id} value={m.id} className="bg-popover text-popover-foreground">
                                        {m.name}
                                    </option>
                                )) : (
                                    <option value="" className="bg-popover text-popover-foreground">
                                        {modelsLoaded ? t('apiTester.noModels') : t('apiTester.loadingModels')}
                                    </option>
                                )}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                        {selectedModel ? (
                            <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
                                <div className="flex items-start gap-3">
                                    <div className={clsx(
                                        "p-2 rounded-md shrink-0 border border-border bg-background/80",
                                        selectedModel.color
                                    )}>
                                        <SelectedModelIcon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium text-sm text-foreground truncate">
                                            {selectedModel.name}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                            {selectedModel.desc}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[11px] text-muted-foreground/70 mt-2">
                                    {t('apiTester.modelPickerHint')}
                                </p>
                            </div>
                        ) : (
                            <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/10 p-3 text-[11px] text-muted-foreground leading-relaxed">
                                {modelsLoaded ? t('apiTester.noModelsHint') : t('apiTester.loadingModelsHint')}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 shrink-0">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-0.5">{t('apiTester.streamMode')}</label>
                        <button
                            onClick={() => setStreamingMode(!streamingMode)}
                            className={clsx(
                                "w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all duration-200",
                                streamingMode
                                    ? "bg-primary/10 border-primary/50 text-foreground"
                                    : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <div className={clsx("p-1.5 rounded-md", streamingMode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                    <Zap className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">{t('apiTester.streamMode')}</span>
                            </div>
                            {streamingMode ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                        </button>
                    </div>

                    <div className="space-y-2 shrink-0">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-0.5">{t('apiTester.accountSelector')}</label>
                        <div className="relative">
                            <select
                                className="w-full h-10 pl-3 pr-8 bg-secondary border border-border rounded-lg text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all cursor-pointer hover:bg-muted"
                                value={selectedAccount}
                                onChange={e => setSelectedAccount(e.target.value)}
                            >
                                <option value="" className="bg-popover text-popover-foreground">{t('apiTester.autoRandom')}</option>
                                {accounts.map((acc, i) => {
                                    const id = resolveAccountIdentifier(acc)
                                    if (!id) return null
                                    return (
                                        <option key={i} value={id} className="bg-popover text-popover-foreground">
                                            👤 {id}
                                        </option>
                                    )
                                })}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-2 shrink-0">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-0.5">{t('apiTester.apiKeyOptional')}</label>
                        <input
                            type="text"
                            autoComplete="off"
                            spellCheck={false}
                            className="w-full h-10 px-3 bg-muted/30 border border-border rounded-lg text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all"
                            placeholder={defaultKeyPreview ? t('apiTester.apiKeyDefault', { preview: defaultKeyPreview }) : t('apiTester.apiKeyPlaceholder')}
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                        />
                        {customKeyActive && (
                            <p className={clsx(
                                "text-[11px] mt-1",
                                customKeyManaged ? "text-emerald-600" : "text-amber-600"
                            )}>
                                {customKeyManaged ? t('apiTester.modeManaged') : t('apiTester.modeDirect')}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
