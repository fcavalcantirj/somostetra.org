export type GenderType = "feminino" | "masculino" | "nao_binario" | "prefiro_nao_informar"
export type CommunicationPreference = "email" | "whatsapp" | "sms" | "telefone"
export type AsiaScale = "A" | "B" | "C" | "D" | "nao_sei"

export interface ProfileFormData {
  username: string
  phone: string
  gender: GenderType | null
  preferred_communication: CommunicationPreference | null
  city: string
  state: string
  cep: string
  date_of_birth: string | null
  injury_date: string | null
  injury_acquired: boolean | null
  asia_scale: AsiaScale | null
  asia_recent_evaluation: boolean | null
  injury_level: string
  pix_key: string
  profile_picture_url: string
  profile_public: boolean
  bio: string
  bio_public: boolean
}
