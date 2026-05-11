import { Lock } from 'lucide-react'

export default function SecuritySection({
    t,
    form,
    setForm,
    newPassword,
    setNewPassword,
    changingPassword,
    onUpdatePassword,
}) {
    return (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold">{t('settings.securityTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm space-y-2">
                    <span className="text-muted-foreground">{t('settings.jwtExpireHours')}</span>
                    <input
                        type="number"
                        min={1}
                        max={720}
                        value={form.admin.jwt_expire_hours}
                        onChange={(e) => setForm((prev) => ({
                            ...prev,
                            admin: { ...prev.admin, jwt_expire_hours: Number(e.target.value || 1) },
                        }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2"
                    />
                </label>
                <label className="text-sm space-y-2">
                    <span className="text-muted-foreground">{t('settings.newPassword')}</span>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder={t('settings.newPasswordPlaceholder')}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2"
                        />
                        <button
                            type="button"
                            onClick={onUpdatePassword}
                            disabled={changingPassword}
                            className="px-3 py-2 rounded-lg bg-secondary border border-border hover:bg-secondary/80 text-sm flex items-center gap-1"
                        >
                            <Lock className="w-4 h-4" />
                            {changingPassword ? t('settings.updating') : t('settings.updatePassword')}
                        </button>
                    </div>
                </label>
            </div>
        </div>
    )
}
