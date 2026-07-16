"use client";

import { useState, useEffect } from "react";
import { Share2, Facebook, Twitter, Linkedin, Link2, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ShareArticleMenuProps {
  title: string;
  slug: string;
}

export function ShareArticleMenu({ title, slug }: ShareArticleMenuProps) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/articles/${slug}`);
  }, [slug]);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "X (Twitter)",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    }
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    // If native share is supported (mostly mobile), use it and prevent popover
    if (navigator.share) {
      e.preventDefault();
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      // Toggle popover state manually when native share is not available
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 px-4 gap-2 rounded-full border-transparent bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-colors font-medium" 
          onClick={handleShareClick}
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline text-xs font-semibold">Share</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-2 rounded-xl shadow-lg border-border/50">
        <div className="flex flex-col gap-1">
          {shareLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {link.name}
              </a>
            );
          })}
          <div className="h-px bg-border my-1" />
          <button
            onClick={handleCopy}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors text-left"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4 text-muted-foreground" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
