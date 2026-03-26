import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

function renderSidebar(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Sidebar />
    </MemoryRouter>
  );
}

describe('Sidebar', () => {
  it('renders 3 nav items: Profile, Discover, Journal', () => {
    renderSidebar('/dashboard');

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Discover')).toBeInTheDocument();
    expect(screen.getByText('Journal')).toBeInTheDocument();
  });

  it('Profile link is active on /profile path', () => {
    renderSidebar('/profile');

    const profileLink = screen.getByLabelText('Profile');
    const discoverLink = screen.getByLabelText('Discover');
    const journalLink = screen.getByLabelText('Journal');

    expect(profileLink.className).toContain('active');
    expect(discoverLink.className).not.toContain('active');
    expect(journalLink.className).not.toContain('active');
  });

  it('Discover link is active on /dashboard path', () => {
    renderSidebar('/dashboard');

    const discoverLink = screen.getByLabelText('Discover');
    expect(discoverLink.className).toContain('active');
  });

  it('Journal link is active on /profile?tab=journal', () => {
    renderSidebar('/profile?tab=journal');

    const journalLink = screen.getByLabelText('Journal');
    const profileLink = screen.getByLabelText('Profile');

    expect(journalLink.className).toContain('active');
    expect(profileLink.className).not.toContain('active');
  });

  it('only one item is active at a time', () => {
    renderSidebar('/profile');

    const links = [
      screen.getByLabelText('Profile'),
      screen.getByLabelText('Discover'),
      screen.getByLabelText('Journal'),
    ];

    const activeLinks = links.filter((link) => link.className.includes('active'));
    expect(activeLinks).toHaveLength(1);
  });
});
