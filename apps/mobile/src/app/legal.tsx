import { ScrollView, Text } from 'react-native';
import { Section } from '@/components/section';

// Draft copy — must be replaced by the reviewed legal texts before any public release (RNF45).
export default function LegalScreen() {
  return (
    <ScrollView
      className="flex-1 bg-crema-50 dark:bg-night-950"
      contentContainerClassName="gap-6 p-5 pb-12"
    >
      <Text className="text-sm italic text-espresso-700 dark:text-crema-200">
        Borrador provisional. El texto definitivo se publicará antes del lanzamiento.
      </Text>
      <Section title="Política de privacidad">
        <Text className="text-base leading-6 text-espresso-900 dark:text-crema-100">
          Usamos tu email para gestionar tu cuenta. Tu ubicación solo se usa mientras usas la app
          para buscar cafés cercanos y nunca se guarda en nuestros servidores. Puedes exportar o
          eliminar tus datos en cualquier momento desde tu perfil.
        </Text>
      </Section>
      <Section title="Términos de uso">
        <Text className="text-base leading-6 text-espresso-900 dark:text-crema-100">
          La información de los cafés la verifican curadores, pero puede cambiar. Las valoraciones y
          fotos que publiques deben ser propias y respetuosas.
        </Text>
      </Section>
    </ScrollView>
  );
}
