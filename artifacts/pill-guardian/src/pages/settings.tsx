import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { useGuardianProfile, usePatientProfile, useProfileMutations } from "@/hooks/use-profiles";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldCheck, User, Clock, CalendarDays, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Translations ───────────────────────────────────────────────────
const translations: Record<string, Record<string, string>> = {
  en: {
    pageTitle: "System Profiles",
    pageSubtitle: "Manage patient details, emergency contact, and system settings.",
    patientTitle: "Patient Profile", patientSub: "The person taking the medication.",
    guardianTitle: "Guardian Profile", guardianSub: "Emergency contact to notify on missed doses.",
    fullName: "Full Name", nickname: "Nickname", phone: "Phone Number", emergencyPhone: "Emergency Phone",
    savePatient: "Save Patient Profile", saveGuardian: "Save Guardian Profile",
    systemSettings: "System Settings", systemSettingsSub: "Configure clock, date, and language.",
    clock: "Daily Clock", date: "Change Date", language: "Language",
    hour: "Hour", minutes: "Minutes", ampm: "AM / PM",
    day: "Day", month: "Month",
    save: "Save", back: "Back", saved: "Saved!",
    am: "AM", pm: "PM",
  },
  ar: {
    pageTitle: "ملفات النظام",
    pageSubtitle: "إدارة تفاصيل المريض، جهة الاتصال الطارئة، وإعدادات النظام.",
    patientTitle: "ملف المريض", patientSub: "الشخص الذي يتناول الدواء.",
    guardianTitle: "ملف الولي", guardianSub: "جهة الاتصال لإعلامها عند تفويت الجرعات.",
    fullName: "الاسم الكامل", nickname: "الاسم المختصر", phone: "رقم الهاتف", emergencyPhone: "هاتف الطوارئ",
    savePatient: "حفظ ملف المريض", saveGuardian: "حفظ ملف الولي",
    systemSettings: "إعدادات النظام", systemSettingsSub: "ضبط الساعة والتاريخ واللغة.",
    clock: "الساعة اليومية", date: "تغيير التاريخ", language: "اللغة",
    hour: "الساعة", minutes: "الدقائق", ampm: "ص / م",
    day: "اليوم", month: "الشهر",
    save: "حفظ", back: "رجوع", saved: "تم الحفظ!",
    am: "ص", pm: "م",
  },
  es: {
    pageTitle: "Perfiles del Sistema",
    pageSubtitle: "Gestiona detalles del paciente, contacto de emergencia y configuración.",
    patientTitle: "Perfil del Paciente", patientSub: "La persona que toma la medicación.",
    guardianTitle: "Perfil del Tutor", guardianSub: "Contacto de emergencia para dosis perdidas.",
    fullName: "Nombre Completo", nickname: "Apodo", phone: "Teléfono", emergencyPhone: "Teléfono de Emergencia",
    savePatient: "Guardar Paciente", saveGuardian: "Guardar Tutor",
    systemSettings: "Configuración", systemSettingsSub: "Configura el reloj, fecha e idioma.",
    clock: "Reloj Diario", date: "Cambiar Fecha", language: "Idioma",
    hour: "Hora", minutes: "Minutos", ampm: "AM/PM",
    day: "Día", month: "Mes",
    save: "Guardar", back: "Volver", saved: "¡Guardado!",
    am: "AM", pm: "PM",
  },
  fr: {
    pageTitle: "Profils Système",
    pageSubtitle: "Gérez les détails du patient, contact d'urgence et paramètres.",
    patientTitle: "Profil Patient", patientSub: "La personne prenant les médicaments.",
    guardianTitle: "Profil Tuteur", guardianSub: "Contact d'urgence pour les doses manquées.",
    fullName: "Nom Complet", nickname: "Surnom", phone: "Téléphone", emergencyPhone: "Téléphone d'Urgence",
    savePatient: "Enregistrer Patient", saveGuardian: "Enregistrer Tuteur",
    systemSettings: "Paramètres Système", systemSettingsSub: "Configurer l'horloge, la date et la langue.",
    clock: "Horloge Quotidienne", date: "Changer la Date", language: "Langue",
    hour: "Heure", minutes: "Minutes", ampm: "AM/PM",
    day: "Jour", month: "Mois",
    save: "Enregistrer", back: "Retour", saved: "Enregistré!",
    am: "AM", pm: "PM",
  },
  ru: {
    pageTitle: "Профили Системы",
    pageSubtitle: "Управление данными пациента, экстренным контактом и настройками.",
    patientTitle: "Профиль Пациента", patientSub: "Человек, принимающий лекарства.",
    guardianTitle: "Профиль Опекуна", guardianSub: "Экстренный контакт при пропуске доз.",
    fullName: "Полное Имя", nickname: "Прозвище", phone: "Телефон", emergencyPhone: "Экстренный Телефон",
    savePatient: "Сохранить Пациента", saveGuardian: "Сохранить Опекуна",
    systemSettings: "Системные Настройки", systemSettingsSub: "Настройка часов, даты и языка.",
    clock: "Ежедневные Часы", date: "Изменить Дату", language: "Язык",
    hour: "Часы", minutes: "Минуты", ampm: "AM/PM",
    day: "День", month: "Месяц",
    save: "Сохранить", back: "Назад", saved: "Сохранено!",
    am: "AM", pm: "PM",
  },
};

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "ru", label: "Русский" },
];

// ─── System Settings Panel ───────────────────────────────────────────
function SystemSettingsPanel({ t }: { t: Record<string, string> }) {
  const { toast } = useToast();
  const [openPanel, setOpenPanel] = useState<"clock" | "date" | "language" | null>(null);

  const [hour, setHour] = useState(() => localStorage.getItem("setting_hour") || "8");
  const [minutes, setMinutes] = useState(() => localStorage.getItem("setting_minutes") || "00");
  const [ampm, setAmpm] = useState(() => localStorage.getItem("setting_ampm") || "AM");
  const [day, setDay] = useState(() => localStorage.getItem("setting_day") || "1");
  const [month, setMonth] = useState(() => localStorage.getItem("setting_month") || "1");
  const [lang, setLang] = useState(() => localStorage.getItem("app_lang") || "en");

  function saveClock() {
    localStorage.setItem("setting_hour", hour);
    localStorage.setItem("setting_minutes", minutes);
    localStorage.setItem("setting_ampm", ampm);
    toast({ title: t.saved });
    setOpenPanel(null);
  }

  function saveDate() {
    localStorage.setItem("setting_day", day);
    localStorage.setItem("setting_month", month);
    toast({ title: t.saved });
    setOpenPanel(null);
  }

  function saveLanguage() {
    localStorage.setItem("app_lang", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    toast({ title: t.saved });
    window.location.reload();
  }

  const toggle = (panel: typeof openPanel) =>
    setOpenPanel(p => (p === panel ? null : panel));

  const inputCls = "w-full bg-background border-2 border-border rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-400 transition-all text-foreground";
  const selectCls = inputCls;

  return (
    <div className="rounded-3xl border border-border overflow-hidden" style={{ background: "rgba(6,18,34,0.7)" }}>
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-border">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,212,255,0.1)" }}>
          <Globe className="w-7 h-7" style={{ color: "#00d4ff" }} />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">{t.systemSettings}</h2>
          <p className="text-muted-foreground text-sm">{t.systemSettingsSub}</p>
        </div>
      </div>

      {/* Clock */}
      <div className="border-b border-border">
        <button onClick={() => toggle("clock")}
          className="w-full flex items-center justify-between px-6 py-4 transition-all hover:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5" style={{ color: "#00e87a" }} />
            <span className="font-semibold text-foreground">{t.clock}</span>
            {localStorage.getItem("setting_hour") && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,232,122,0.12)", color: "#00e87a" }}>
                {localStorage.getItem("setting_hour")}:{localStorage.getItem("setting_minutes")} {localStorage.getItem("setting_ampm")}
              </span>
            )}
          </div>
          {openPanel === "clock" ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {openPanel === "clock" && (
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">{t.hour}</label>
                <input type="number" min={1} max={12} value={hour} onChange={e => setHour(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">{t.minutes}</label>
                <input type="number" min={0} max={59} value={minutes} onChange={e => setMinutes(e.target.value.padStart(2, "0"))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">{t.ampm}</label>
                <select value={ampm} onChange={e => setAmpm(e.target.value)} className={selectCls}>
                  <option value="AM">{t.am}</option>
                  <option value="PM">{t.pm}</option>
                </select>
              </div>
            </div>
            <button onClick={saveClock} className="w-full py-3 rounded-xl font-bold text-white transition-all" style={{ background: "#00e87a", color: "#001a0d" }}>
              {t.save}
            </button>
          </div>
        )}
      </div>

      {/* Date */}
      <div className="border-b border-border">
        <button onClick={() => toggle("date")}
          className="w-full flex items-center justify-between px-6 py-4 transition-all hover:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5" style={{ color: "#a78bfa" }} />
            <span className="font-semibold text-foreground">{t.date}</span>
            {localStorage.getItem("setting_day") && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa" }}>
                {localStorage.getItem("setting_day")}/{localStorage.getItem("setting_month")}
              </span>
            )}
          </div>
          {openPanel === "date" ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {openPanel === "date" && (
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">{t.day}</label>
                <input type="number" min={1} max={31} value={day} onChange={e => setDay(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">{t.month}</label>
                <input type="number" min={1} max={12} value={month} onChange={e => setMonth(e.target.value)} className={inputCls} />
              </div>
            </div>
            <button onClick={saveDate} className="w-full py-3 rounded-xl font-bold text-white transition-all" style={{ background: "#a78bfa", color: "#fff" }}>
              {t.save}
            </button>
          </div>
        )}
      </div>

      {/* Language */}
      <div>
        <button onClick={() => toggle("language")}
          className="w-full flex items-center justify-between px-6 py-4 transition-all hover:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5" style={{ color: "#00d4ff" }} />
            <span className="font-semibold text-foreground">{t.language}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,212,255,0.12)", color: "#00d4ff" }}>
              {LANGUAGES.find(l => l.value === lang)?.label}
            </span>
          </div>
          {openPanel === "language" ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {openPanel === "language" && (
          <div className="px-6 pb-6 space-y-4">
            <select value={lang} onChange={e => setLang(e.target.value)} className={selectCls}>
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <button onClick={saveLanguage} className="w-full py-3 rounded-xl font-bold text-white transition-all" style={{ background: "#00d4ff", color: "#001a2a" }}>
              {t.save}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  nickname: z.string().min(1, "Nickname is required"),
  phone: z.string().min(5, "Valid phone number is required"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { data: guardian } = useGuardianProfile();
  const { data: patient } = usePatientProfile();
  const { saveGuardian, savePatient } = useProfileMutations();
  const lang = localStorage.getItem("app_lang") || "en";
  const t = translations[lang] ?? translations["en"]!;

  // Apply RTL on mount
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const patientForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", nickname: "", phone: "" }
  });
  const guardianForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", nickname: "", phone: "" }
  });

  useEffect(() => {
    if (patient) patientForm.reset({ name: patient.name, nickname: patient.nickname, phone: patient.phone });
  }, [patient]);

  useEffect(() => {
    if (guardian) guardianForm.reset({ name: guardian.name, nickname: guardian.nickname, phone: guardian.phone });
  }, [guardian]);

  const onSubmitPatient = (data: ProfileFormData) =>
    savePatient.mutate({ data }, {
      onSuccess: () => toast({ title: t.saved }),
      onError: () => toast({ title: "Failed to update profile", variant: "destructive" })
    });

  const onSubmitGuardian = (data: ProfileFormData) =>
    saveGuardian.mutate({ data }, {
      onSuccess: () => toast({ title: t.saved }),
      onError: () => toast({ title: "Failed to update profile", variant: "destructive" })
    });

  const inputCls = "w-full bg-background border-2 border-border rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all";

  return (
    <Layout>
      <header className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">{t.pageTitle}</h1>
        <p className="text-muted-foreground mt-2 text-base sm:text-lg">{t.pageSubtitle}</p>
      </header>

      <div className="space-y-8">
        {/* Profiles row */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Patient */}
          <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-xl border border-border">
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">{t.patientTitle}</h2>
                <p className="text-muted-foreground text-sm">{t.patientSub}</p>
              </div>
            </div>
            <form onSubmit={patientForm.handleSubmit(onSubmitPatient)} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">{t.fullName}</label>
                <input {...patientForm.register("name")} className={inputCls} placeholder="John Doe" />
                {patientForm.formState.errors.name && <p className="text-destructive text-sm mt-1">{patientForm.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">{t.nickname}</label>
                  <input {...patientForm.register("nickname")} className={inputCls} placeholder="Johnny" />
                  {patientForm.formState.errors.nickname && <p className="text-destructive text-sm mt-1">{patientForm.formState.errors.nickname.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">{t.phone}</label>
                  <input {...patientForm.register("phone")} className={inputCls} placeholder="+1 555 1234" />
                  {patientForm.formState.errors.phone && <p className="text-destructive text-sm mt-1">{patientForm.formState.errors.phone.message}</p>}
                </div>
              </div>
              <button type="submit" disabled={savePatient.isPending}
                className="w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                style={{ background: "#2563eb", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}>
                {savePatient.isPending ? "Saving..." : t.savePatient}
              </button>
            </form>
          </div>

          {/* Guardian */}
          <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-xl border border-border">
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(245,158,11,0.1)" }}>
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-warning" />
              </div>
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">{t.guardianTitle}</h2>
                <p className="text-muted-foreground text-sm">{t.guardianSub}</p>
              </div>
            </div>
            <form onSubmit={guardianForm.handleSubmit(onSubmitGuardian)} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">{t.fullName}</label>
                <input {...guardianForm.register("name")} className={inputCls} placeholder="Jane Doe" />
                {guardianForm.formState.errors.name && <p className="text-destructive text-sm mt-1">{guardianForm.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">{t.nickname}</label>
                  <input {...guardianForm.register("nickname")} className={inputCls} placeholder="Mom" />
                  {guardianForm.formState.errors.nickname && <p className="text-destructive text-sm mt-1">{guardianForm.formState.errors.nickname.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">{t.emergencyPhone}</label>
                  <input {...guardianForm.register("phone")} className={inputCls} placeholder="+1 555 9876" />
                  {guardianForm.formState.errors.phone && <p className="text-destructive text-sm mt-1">{guardianForm.formState.errors.phone.message}</p>}
                </div>
              </div>
              <button type="submit" disabled={saveGuardian.isPending}
                className="w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                style={{ background: "#2563eb", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}>
                {saveGuardian.isPending ? "Saving..." : t.saveGuardian}
              </button>
            </form>
          </div>
        </div>

        {/* System Settings */}
        <SystemSettingsPanel t={t} />
      </div>
    </Layout>
  );
}
