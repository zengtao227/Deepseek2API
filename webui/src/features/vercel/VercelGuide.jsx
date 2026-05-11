import { Info } from 'lucide-react'

export default function VercelGuide({ t }) {
    return (
        <div className="bg-secondary/20 border border-border rounded-xl p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-primary" />
                {t('vercel.howItWorks')}
            </h3>
            <ul className="space-y-4">
                <li className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">1</span>
                    <p className="text-sm text-muted-foreground">{t('vercel.steps.one')}</p>
                </li>
                <li className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">2</span>
                    <p className="text-sm text-muted-foreground">{t('vercel.steps.two')}</p>
                </li>
                <li className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">3</span>
                    <p className="text-sm text-muted-foreground">
                        {t('vercel.steps.three')} <code className="bg-background px-1 py-0.5 rounded border border-border text-xs">DS2API_CONFIG_JSON</code>
                    </p>
                </li>
                <li className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">4</span>
                    <p className="text-sm text-muted-foreground">{t('vercel.steps.four')}</p>
                </li>
            </ul>
        </div>
    )
}
