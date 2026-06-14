# GuiaTur 🗺️

Guia turístico mobile que mostra pontos de interesse em um mapa e **avisa automaticamente** o usuário, com informações históricas, quando ele chega perto de um ponto cadastrado.

Feito com **React Native + Expo (SDK 54)**, TypeScript e NativeWind.

---

## O problema que o app resolve

Quem passeia por uma cidade quase nunca sabe que está passando ao lado de um ponto histórico ou cultural relevante. Guias em papel e listas estáticas exigem que a pessoa pare e procure ativamente.

O **GuiaTur** inverte essa lógica: em vez de o usuário procurar a informação, é **a informação que encontra o usuário**. Enquanto ele caminha, o app monitora a posição em tempo real e, ao entrar no raio de um ponto turístico, exibe automaticamente um cartão com foto, descrição e distância — sem o usuário precisar tocar em nada.

Os pontos vêm de duas fontes combinadas:

- **Google Places API** — atrações turísticas reais ao redor da localização atual.
- **Servidor local (json-server)** — pontos cadastrados pelo próprio usuário dentro do app.

---

## 📍 Hardware aplicado: Geolocalização e Mapas

O hardware sorteado para o projeto foi **Geolocalização e Mapas** (`expo-location` + `react-native-maps`), e ele é o **coração do app** — sem ele, nada funciona.

Como cada parte foi usada:

- **Permissões de localização em tempo de execução** — uma tela dedicada solicita a permissão de localização (`requestForegroundPermissionsAsync`) antes de qualquer uso. Sem a permissão concedida, o acesso às abas fica bloqueado.
- **Captura de GPS em tempo real** — um contexto global (`LiveLocationProvider`) usa `watchPositionAsync` com alta precisão (`accuracy: High`, atualização a cada ~10 m de deslocamento) e disponibiliza a latitude/longitude atual para todas as telas.
- **Mapa interativo** — `react-native-maps` (provider Google) plota os pontos como marcadores, mostra a posição "você está aqui" e desenha os **círculos de geofence** de cada ponto.
- **Geofencing por fórmula de Haversine** — a cada atualização de posição, o app calcula a distância real (em metros) entre o usuário e cada ponto. Ao entrar no raio configurado, dispara automaticamente um modal de proximidade (uma única vez por ponto, por sessão).
- **Cálculo de distância em tempo real** — a distância até cada ponto aparece e se atualiza conforme o usuário se move (na lista, nos detalhes e no modal).
- **"Como chegar"** — abre o app de mapas nativo com a rota até o ponto.

### Extra (bônus): Câmera e Galeria 📷

Como complemento ao hardware principal, o formulário de cadastro também usa a **câmera** e a **galeria de fotos** do dispositivo (`expo-image-picker`): ao criar um ponto, o usuário pode tirar uma foto na hora, escolher uma imagem do celular **ou** colar uma URL.

---

## 📱 Telas

O app usa **navegação por abas** (bottom tabs) mais uma tela de detalhes:

| Tela | Descrição |
|---|---|
| **Permissões** | Tela de entrada que solicita o acesso à localização. Trata o caso de permissão negada e libera o app apenas quando concedida. |
| **Mapa** | Mapa do Google com os marcadores (rosa = meus pontos, na cor escolhida; lilás = Google) e os círculos de geofence. Tem um **campo de busca** que consulta a Google Places API e centraliza o mapa nos resultados. O modal de proximidade aparece aqui automaticamente. |
| **Explorar** | Lista de cartões com foto, categoria e **distância ao vivo** de cada ponto. Inclui **filtro por fonte** (Todos / Meus pontos / Google). |
| **Detalhes** | Foto, descrição, distância em tempo real, um **mini-mapa** com a localização do ponto e o botão "Como chegar". |
| **Adicionar** | Formulário de cadastro de um novo ponto (descrito abaixo). |

---

## 📝 Formulário principal (Adicionar ponto)

Formulário validado com **Zod + React Hook Form**, com mensagens de erro por campo e um `*` indicando os campos obrigatórios:

- **Nome** — mínimo de 3 caracteres.
- **Descrição histórica** — mínimo de 20 caracteres.
- **Categoria** — seletor (Museu, Monumento, Parque, Religioso, Cultural) com a opção **"Outro"**, que libera um campo de texto para uma categoria personalizada.
- **Raio do geofence (metros)** — número entre 50 e 1000.
- **Imagem** — por **URL**, **galeria** ou **câmera**, com pré-visualização.
- **Cor do marcador** — seletor de cores (swatches) para personalizar o pino no mapa.
- **Localização do ponto** — um **mini-mapa interativo** centrado na posição atual, onde o usuário toca/arrasta o pino para definir o local exato (com zoom para precisão), limitado a **30 m** da localização atual, ou usa o botão "Usar localização atual".
- **Geofence ativo** — switch para ativar/desativar o monitoramento do ponto.

Ao salvar, o ponto é enviado via **POST** para o json-server e passa a aparecer no mapa e na lista.

---

## 🧰 Tecnologias

- **Expo SDK 54** + **React Native 0.81** + **React 19** + **TypeScript**
- **expo-router** — navegação por arquivos (file-based routing)
- **expo-location** + **react-native-maps** — hardware de geolocalização e mapas
- **expo-image-picker** — câmera e galeria
- **react-hook-form** + **zod** — formulário e validação
- **axios** — chamadas HTTP (json-server e Google Places API)
- **json-server** — backend local (CRUD dos pontos)
- **NativeWind** (Tailwind) — estilização

---

## 🚀 Como rodar

> Recomenda-se testar em um **celular físico** com o Expo Go, pois o mapa do Google pode renderizar em branco em emuladores Android.

1. **Instalar as dependências**
   ```bash
   npm install
   ```

2. **Configurar as variáveis de ambiente** — copie `.env.example` para `.env` e preencha:
   ```bash
   # Chave do Google usada nas chamadas da Places API
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=sua-chave-aqui

   # URL do json-server. No celular físico, use o IP da sua máquina na rede:
   EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3001
   ```
   > A chave do Google precisa ter a **Places API (New)** habilitada e **não** pode estar restrita a apps Android (as chamadas são feitas via HTTP).

3. **Subir o backend** (em um terminal)
   ```bash
   npm run server
   ```

4. **Iniciar o app** (em outro terminal)
   ```bash
   npx expo start
   ```
   Escaneie o QR Code com o **Expo Go** no celular (celular e PC na mesma rede Wi-Fi).

### URL do servidor por ambiente

| Onde você roda | `EXPO_PUBLIC_API_URL` |
|---|---|
| Celular físico (Expo Go) | `http://<IP-da-sua-máquina>:3001` |
| Emulador Android | `http://10.0.2.2:3001` |
| Simulador iOS / web | `http://localhost:3001` |

---

## 📂 Estrutura

```
src/
  app/                 # rotas (expo-router): index (Mapa), explore, add, permissions, place/[id]
  components/          # PointCard, ProximityModal, FormInput, ImageField, ColorField, LocationPicker...
  contexts/            # permissão de localização e localização ao vivo
  hooks/               # useGeofencing
  services/            # jsonServer, placesApi, googleApiClient (axios)
  schemas/             # validação Zod do formulário
  types/               # tipos compartilhados (Place, MapPoint, categorias)
  utils/               # haversine, geofence
db.json                # banco de dados do json-server
```
