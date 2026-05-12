package com.library.config;

import com.library.entity.Book;
import com.library.entity.User;
import com.library.repository.BookRepository;
import com.library.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {
    @Autowired private UserRepository userRepository;
    @Autowired private BookRepository bookRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Create admin user
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setEmail("admin@library.com");
            admin.setFullName("Library Admin");
            admin.setRole(User.Role.ADMIN);
            userRepository.save(admin);
        }

        // Create sample user
        if (!userRepository.existsByUsername("user")) {
            User user = new User();
            user.setUsername("user");
            user.setPassword(passwordEncoder.encode("user123"));
            user.setEmail("user@library.com");
            user.setFullName("John Doe");
            user.setRole(User.Role.USER);
            userRepository.save(user);
        }

        // Seed books
        if (bookRepository.count() == 0) {
            String[][] books = {
                {"The Great Gatsby", "F. Scott Fitzgerald", "Classic Fiction", "9780743273565", "Scribner", "1925-04-10",
                 "A story of the mysteriously wealthy Jay Gatsby and his love for Daisy Buchanan.", "3"},
                {"To Kill a Mockingbird", "Harper Lee", "Classic Fiction", "9780061935466", "HarperCollins", "1960-07-11",
                 "The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.", "5"},
                {"1984", "George Orwell", "Dystopian Fiction", "9780451524935", "Signet Classic", "1949-06-08",
                 "A dystopian social science fiction novel and cautionary tale.", "4"},
                {"Pride and Prejudice", "Jane Austen", "Romance", "9780141439518", "Penguin Classics", "1813-01-28",
                 "A romantic novel that charts the emotional development of protagonist Elizabeth Bennet.", "2"},
                {"The Hobbit", "J.R.R. Tolkien", "Fantasy", "9780547928227", "Houghton Mifflin", "1937-09-21",
                 "A fantasy novel and children's book by J. R. R. Tolkien.", "3"},
                {"Dune", "Frank Herbert", "Science Fiction", "9780441013593", "Ace", "1965-08-01",
                 "Set in the distant future amidst a feudal interstellar society.", "2"},
                {"The Catcher in the Rye", "J.D. Salinger", "Literary Fiction", "9780316769174", "Little Brown", "1951-07-16",
                 "A story about Holden Caulfield, a teenager from New York City.", "4"},
                {"Brave New World", "Aldous Huxley", "Dystopian Fiction", "9780060850524", "HarperCollins", "1932-08-18",
                 "A dystopian social science fiction novel.", "3"},
                {"The Alchemist", "Paulo Coelho", "Philosophical Fiction", "9780062315007", "HarperCollins", "1988-01-01",
                 "A novel about a young Andalusian shepherd in his journey toward his dream.", "5"},
                {"Harry Potter and the Philosopher's Stone", "J.K. Rowling", "Fantasy", "9780590353427", "Scholastic", "1997-06-26",
                 "The first novel in the Harry Potter series.", "6"},
                {"The Lord of the Rings", "J.R.R. Tolkien", "Fantasy", "9780618640157", "Houghton Mifflin", "1954-07-29",
                 "An epic high fantasy novel.", "2"},
                {"Clean Code", "Robert C. Martin", "Technology", "9780132350884", "Prentice Hall", "2008-08-01",
                 "A handbook of agile software craftsmanship.", "4"}
            };

            for (String[] b : books) {
                Book book = new Book();
                book.setTitle(b[0]);
                book.setAuthor(b[1]);
                book.setGenre(b[2]);
                book.setIsbn(b[3]);
                book.setPublisher(b[4]);
                book.setPublicationDate(LocalDate.parse(b[5]));
                book.setDescription(b[6]);
                int copies = Integer.parseInt(b[7]);
                book.setTotalCopies(copies);
                book.setAvailableCopies(copies);
                book.setStatus(Book.BookStatus.AVAILABLE);
                bookRepository.save(book);
            }
        }
    }
}
