import { Chat } from "@/components/Chat"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="w-full py-6 md:py-12 lg:py-16">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Your AI-Powered Knowledge Hub
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Chat with AI to manage your calendar and knowledge base. Try saying:
                  <br />
                  "Schedule a meeting for tomorrow at 2pm" or
                  <br />
                  "Add a note about project ideas"
                </p>
              </div>
              <Chat />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

